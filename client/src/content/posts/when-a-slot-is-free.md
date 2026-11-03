title: Deciding whether a booking slot is free
date: 2026-10-04
updated: 2026-11-03
about: Clientbridge
cover: /img/posts/when-a-slot-is-free-wide.webp
card: /img/posts/when-a-slot-is-free-card.webp
summary: Clientbridge checks working hours, time off, buffers, capacity and resources before accepting a booking. Locks and database constraints protect against conflicting writes.

Clientbridge books visits for service businesses: a groomer with two rooms, a salon with five stylists, a cleaner working alone. Every booking starts with the same question, which is whether a given member is free at a given time.

Availability depends on several conditions, checked in a fixed order. A booking also needs protection against another request taking the same time between the check and the write.

## Checking availability

`slot_problem` answers why a visit cannot take a window, and returns nothing when it can. It asks four questions and stops at the first failure.

A closure or the member's time off comes first. Both are rows in the same `hours` table with `basis = "exception"`, and the query orders business-wide closures ahead of one member's absence, so a day the business is shut reads as closed rather than as that person being away. Working hours come next, then an overlapping visit, then the room or chair the service needs.

The order decides the message. A client picking a time on a closed holiday is told the business is closed then, not that the stylist is booked. Each verdict carries a machine-readable problem and a sentence written for the person reading it, and a closure can carry its own reason.

## Including setup and cleanup time

A sixty minute groom with fifteen minutes of cleanup after it occupies seventy-five minutes of that room's day. Clientbridge keeps those minutes on the service as `buffer_before_min` and `buffer_after_min`, and the overlap test widens both sides of the comparison.

![An incoming visit and an existing one, each widened by its own before and after buffers. The gap between them looks free until the buffers are included.](figure:buffered-window)

The incoming window grows by the new service's buffers. The existing slots are joined to their own service rows and grow by theirs. Two visits that do not overlap on the clock can still collide, which is the case the plain comparison misses.

The query also handles classes. A class is one slot with a capacity, so a second booking for the same service at the same start is a seat rather than a conflict. The query treats a slot as blocking only when it is full, or for a different service, or at a different time. Seats are counted as live bookings on the slot, which excludes cancelled and waitlisted ones.

## The same rule, written twice

The check above evaluates one window. A booking page needs a list of available start times for a date.

`open_starts` produces that list. It reads hours, closures, time off and live slots once for the span, then walks the day's open windows on a step grid and applies the same predicate in memory. It is intended to return the start times that `slot_problem` would accept. The grid step is the business's configured interval, or the service's full length including buffers when no interval is set.

Two implementations of one rule have to be kept in agreement, and they already differ in one place. When a member has no hours configured for a weekday, the listing returns no times at all, while the window check treats that day as open. A business whose working week is not set up yet offers nothing online, and the same time booked by hand from the business side is accepted.

## Checking and writing are two statements

Every path that creates a visit goes through `create_booking_core`: the staff calendar, the recurrence expander and the public booking page. It takes a Postgres advisory lock on the member for the transaction. That prevents another booking using the same lock from changing availability between the check and insert.

The member lock is keyed by business and member. Multi-member operations take those keys in sorted order. Resource selection has its own sorted resource locks, taken after the staff locks, so two different staff members cannot both claim the same room based on an earlier availability read. Other operations also lock hours or booking rows as needed; the new-slot path illustrated here is not a universal list for every scheduling operation.

![The new-slot path holds the member lock, checks availability, locks candidate resources in id order, rechecks resource availability and inserts the slot. Locks remain held through commit.](figure:lock-order)

## Preventing overlapping slots in the database

The current implementation adds resource locks before selecting a room or piece of equipment. Consider two staff members attempting overlapping visits in the same room. Each can acquire its own member lock, but only one holds the room's lock. The second waits; after the first transaction commits, it rechecks the room with buffers included and refuses the request or selects another eligible resource.

The `slots` table also carries two GiST exclusion constraints as a database backstop. One refuses a second live slot for the same business and member over an overlapping time range, the other does the same for a resource, and both ignore cancelled slots. The insert catches an integrity error and translates a recognized constraint violation into the corresponding booking conflict.

The constraints cover fewer conditions than the application checks. They compare the stored start and end of a slot, which means they know nothing about buffers, hours, time off or class capacity. A fifteen minute cleanup overlapping the next visit is caught by the buffer-aware application check under the resource lock, not by the stored-range constraint.

So the two layers do different jobs. The checks decide whether a booking should be allowed and produce the message a person reads. The constraints make the overlap itself impossible to store, whatever path tried to write it, including a future one that forgets to take the lock.

## Protecting the write

Reading availability does not reserve it. Staff and resource locks coordinate the current application writes; exclusion constraints independently reject overlapping stored ranges. Adding a bookable resource requires both a rule for availability and a write path that rechecks it while holding the appropriate lock.
