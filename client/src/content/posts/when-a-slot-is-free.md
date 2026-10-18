title: Deciding whether a booking slot is free
date: 2026-10-04
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

The lock key is the business and the member, so writes for one person serialise and writes for different people do not block each other. Where an operation touches more than one member, as rescheduling onto another stylist does, the keys are taken in sorted order. The documented lock order is hours, members by id, bookings by id, then slots. Taking locks in a consistent order avoids transactions waiting on each other in opposite orders.

![The locks a booking takes, always in the same order: the hours lock, then members by id, then bookings by id, then slots.](figure:lock-order)

## Preventing overlapping slots in the database

The lock covers one member. Two members booking the same room at the same time take different keys, so nothing in the application serialises them.

The `slots` table carries two GiST exclusion constraints for that. One refuses a second live slot for the same business and member over an overlapping time range, the other does the same for a resource, and both ignore cancelled slots. The insert is wrapped in a try, and when it fails, `clash` reads the constraint's name out of the error to tell a double-booked person from a double-booked room, so the client still gets the right sentence.

The constraints cover fewer conditions than the application checks. They compare the stored start and end of a slot, which means they know nothing about buffers, hours, time off or class capacity. A fifteen minute cleanup overlapping the next visit is caught by the application and not by the database.

So the two layers do different jobs. The checks decide whether a booking should be allowed and produce the message a person reads. The constraints make the overlap itself impossible to store, whatever path tried to write it, including a future one that forgets to take the lock.

## Protecting the write

Written out, a free slot means this service, for this member, in this room, inside hours that are open, clear of closures and time off, clear of other visits once everyone's buffers are counted, and still unclaimed when the row is written.

Reading availability does not reserve it. The advisory locks coordinate application writes, and the exclusion constraints prevent stored time ranges from overlapping for the same member or resource. A new kind of bookable resource needs both its availability rules and a plan for concurrent requests.
