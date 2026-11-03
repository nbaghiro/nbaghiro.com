title: A weekly appointment across a clock change
date: 2026-09-21
updated: 2026-11-03
about: Scheduling
category: Industry & practice
cover: /img/posts/recurring-appointments-and-clock-changes-wide.webp
card: /img/posts/recurring-appointments-and-clock-changes-card.webp
summary: A recurring appointment carries a local-time intention. Keeping that intention requires more than repeating the first timestamp.

A weekly appointment usually expresses an intention about local time. Someone booking Monday at nine expects Monday at nine on their calendar, including after a clock change.

The recurrence needs a local time and named zone as well as the resulting instants.

## A concrete week on the calendar

Consider a weekly appointment at 9 a.m. in Toronto. On Monday, 26 October 2026, that local time corresponds to 13:00 UTC. On Monday, 2 November, after the daylight-saving transition, 9 a.m. corresponds to 14:00 UTC.

Adding exactly seven days to the first UTC instant would produce 13:00 UTC on 2 November, which is 8 a.m. in Toronto. The elapsed interval would be consistent, but the appointment would have moved on the customer's local calendar.

The recurrence guidance in [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html#section-3.8.5.3) recommends a local start time with a time-zone reference when recurring instances should start at the same local time through time-zone changes. For this example, the rule needs Monday, 9 a.m. and a zone such as `America/Toronto`.

## Choosing whose time stays fixed

That choice is part of the product's meaning. For a service performed at a Toronto business, the business's local time may define the appointment. A customer visiting another time zone can see a converted display without changing the actual booking.

A remote meeting needs the same decision, even when there is no physical venue. The organizer might intend nine in their own time zone. Other attendees can then see a different local hour when their clock-change dates do not align with the organizer's. Showing the controlling time zone helps make that behavior understandable.

A fixed offset such as UTC minus five does not fully describe a region's calendar rules. A named zone lets the system apply the rules for the date being generated. The local recurrence and the resulting UTC instants serve different purposes, so keeping both concepts explicit makes later changes easier to reason about.

## Handling times near a transition

Some local times do not occur when clocks move forward; others occur twice when clocks move back. RFC 5545 distinguishes explicit date-time interpretation from recurrence expansion: a recurrence-generated nonexistent local time is ignored rather than counted as an occurrence. A product that instead moves that booking to another time needs to state its override and ensure its exported invitations agree.

For a business calendar, I would make the resulting occurrence visible before someone confirms the series. If the system skips an occurrence or resolves an ambiguous time in a particular way, the preview should reveal that choice. A person should not need to understand time-zone internals to know when the appointment will happen.

The same preview can show the next few dates around a transition. Checking only the first generated occurrence would miss the problem that makes this example interesting: the first week can be correct while the next one has moved.

## What the stored series has to hold

The behaviour described above depends on what the database keeps. A row holding only the first
instant and an interval cannot produce the right answer later, because the information needed
to produce it was never stored.

A series needs the local start time, the named zone, the recurrence rule and its exceptions.
From those, any occurrence can be generated for any date, including dates whose offset rules
change after the booking was made. Time-zone databases are updated when governments change the
rules, so a series generated today and the same series generated next year can legitimately
differ. Storing the rule rather than the results is what allows that correction to apply.

Many systems also materialise occurrences for calendars, reminders and booking operations. Generated dates can be rebuilt, but confirmed bookings and their exceptions are business records, not disposable cache entries. Regeneration must preserve identities, cancellations and explicit moves, and follow a stated policy before changing already-confirmed future appointments after a time-zone update.

## Reminders inherit the problem

A reminder rule must distinguish elapsed time from local calendar time. “24 hours before” subtracts 24 elapsed hours from the resolved instant. “The previous day at 9 a.m.” resolves a new local date and time. Across a clock change, those instructions can produce different instants even when they usually coincide.

Compute the chosen reminder rule from the resolved occurrence and its controlling zone, then regenerate pending notifications when that occurrence changes.

The customer's own device adds a second zone. Someone who books in Toronto and travels to
Lisbon will see the appointment shifted in their calendar, correctly, while the business still
expects them at the Toronto hour. A reminder that states the time in both zones removes a
question the customer would otherwise have to work out.

## Preserving exceptions when a series changes

Recurring appointments also acquire exceptions. Someone cancels one week, moves another appointment or changes the start time for future weeks. Those decisions need to survive later regeneration of the series.

An edit to one occurrence should not silently rewrite the rule for every week. An edit to future occurrences should make clear where the change begins. Previously canceled appointments should not reappear simply because the application rebuilt its list of dates.

I would test a short series on both sides of a clock change, then move one occurrence and cancel another. After changing the future schedule, I would check the displayed local times, the underlying instants and the preserved exceptions. Check the reminder rule separately on the transition dates.
