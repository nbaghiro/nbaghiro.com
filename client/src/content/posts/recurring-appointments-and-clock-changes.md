title: A weekly appointment across a clock change
date: 2026-09-21
about: Scheduling
category: Industry & practice
cover: /img/posts/recurring-appointments-and-clock-changes-wide.webp
card: /img/posts/recurring-appointments-and-clock-changes-card.webp
summary: A recurring appointment carries a local-time intention. Keeping that intention requires more than repeating the first timestamp.

A weekly appointment at 9 am usually means 9 am in the place where the appointment happens. Across a daylight-saving change, the corresponding UTC time can move by an hour.

That makes a recurring appointment different from repeating one timestamp every seven days.

## The customer’s view

[The iCalendar standard](https://www.rfc-editor.org/rfc/rfc5545.html#section-3.8.5.3) accounts for this. It recommends defining most recurring events with a local start time and a time-zone reference so the occurrences keep the same local time when the offset changes.

For a customer, the distinction shows up in a reminder or a calendar invitation. The booking page can look right today while an occurrence months away has shifted.

When checking scheduling software, I would create a recurring booking that crosses a clock change and inspect the later invitations. I would also check which location's time zone controls the series. A customer travelling elsewhere should be able to see the appointment in their current zone without changing when the business expects them.

## An appointment has a location

A one-off timestamp identifies an instant. A recurring rule also needs to express an intention: every Monday at a particular local time, in a particular place. Both are useful pieces of information. Losing the local intention makes it harder to generate later occurrences correctly.

Consider a weekly appointment with a business in Toronto and a customer travelling abroad. The business’s opening hours still belong to Toronto. The customer may want to see the equivalent time where they are staying. Changing the displayed time should not silently move the appointment itself.

## Checking more than the first occurrence

A short preview of a recurring series can hide an error that only appears after the offset changes. Inspecting dates on both sides of that change is more informative than checking the first invitation alone.

The same review should cover edits. Moving one appointment and changing the entire series are different requests, and the interface should make that scope clear. This is a product behavior to test explicitly, rather than something to infer from the fact that the calendar accepts recurring events.
