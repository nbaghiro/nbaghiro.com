title: A weekly appointment across a clock change
date: 2026-09-21
about: Scheduling
category: Industry & practice
cover: /img/posts/recurring-appointments-and-clock-changes-wide.webp
card: /img/posts/recurring-appointments-and-clock-changes-card.webp
summary: A recurring appointment carries a local-time intention. Keeping that intention requires more than repeating the first timestamp.

A weekly appointment usually expresses an intention about local time. Someone booking Monday at nine expects Monday at nine on their calendar, including after a clock change.

Storing the first appointment as an instant is useful, but repeating that instant every seven days does not always preserve the local-time intention. The series needs enough information to generate each occurrence in the time zone where the appointment is meant to stay fixed.

## A concrete week on the calendar

Consider a weekly appointment at 9 a.m. in Toronto. On Monday, 26 October 2026, that local time corresponds to 13:00 UTC. On Monday, 2 November, after the daylight-saving transition, 9 a.m. corresponds to 14:00 UTC.

Adding exactly seven days to the first UTC instant would produce 13:00 UTC on 2 November, which is 8 a.m. in Toronto. The elapsed interval would be consistent, but the appointment would have moved on the customer's local calendar.

The recurrence guidance in [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html#section-3.8.5.3) recommends a local start time with a time-zone reference when recurring instances should start at the same local time through time-zone changes. For this example, the rule needs Monday, 9 a.m. and a zone such as `America/Toronto`.

## Choosing whose time stays fixed

That choice is part of the product's meaning. For a service performed at a Toronto business, the business's local time may define the appointment. A customer visiting another time zone can see a converted display without changing the actual booking.

A remote meeting needs the same decision, even when there is no physical venue. The organizer might intend nine in their own time zone. Other attendees can then see a different local hour when their clock-change dates do not align with the organizer's. Showing the controlling time zone helps make that behavior understandable.

A fixed offset such as UTC minus five does not fully describe a region's calendar rules. A named zone lets the system apply the rules for the date being generated. The local recurrence and the resulting UTC instants serve different purposes, so keeping both concepts explicit makes later changes easier to reason about.

## Handling times near a transition

Some local times do not occur when clocks move forward. Others occur twice when clocks move back. A scheduling product needs a defined policy for a recurrence that lands in one of those periods.

For a business calendar, I would make the resulting occurrence visible before someone confirms the series. If the system skips an occurrence or resolves an ambiguous time in a particular way, the preview should reveal that choice. A person should not need to understand time-zone internals to know when the appointment will happen.

The same preview can show the next few dates around a transition. Checking only the first generated occurrence would miss the problem that makes this example interesting: the first week can be correct while the next one has moved.

## Preserving exceptions when a series changes

Recurring appointments also acquire exceptions. Someone cancels one week, moves another appointment or changes the start time for future weeks. Those decisions need to survive later regeneration of the series.

An edit to one occurrence should not silently rewrite the rule for every week. An edit to future occurrences should make clear where the change begins. Previously canceled appointments should not reappear simply because the application rebuilt its list of dates.

I would test a short series on both sides of a clock change, then move one occurrence and cancel another. After changing the future schedule, I would check the displayed local times, the underlying instants and the preserved exceptions. Reminders should be derived from those resolved occurrences as well. That keeps the notification tied to the appointment the person actually sees on the calendar.
