title: Calendar membership and incremental sync
date: 2026-11-10
about: Engineering
cover: /img/posts/calendar-membership-and-incremental-sync-wide.webp
card: /img/posts/calendar-membership-and-incremental-sync-card.webp
summary: A calendar sync design that separates the records belonging in a calendar from the changes since a cursor, including removals, moving windows, partial failures, and recovery.

A calendar integration can correctly copy every new appointment and still leave old appointments behind. A cancellation removes an event from the current query. A reassignment changes who should see it. Moving an appointment beyond the sync window can make it disappear from the next response without deleting the copy already on someone's calendar.

These cases need two separate questions: what belongs in this calendar now, and what changed since the previous sync?

The examples below use a fictional appointment service. They describe a design for keeping a calendar projection current, rather than a particular product's implementation. The same distinction is useful for offline clients, search indexes, and other systems that keep a copy of a changing subset of records.

## Define the calendar's membership

A sync scope identifies the records the integration is responsible for. It might include a connected account, a destination calendar, a staff member, an access policy, and a date window.

For example, a staff calendar could contain confirmed appointments assigned to that person that overlap November. The overlap rule matters: an appointment starting before the window but ending inside it still occupies time. For a half-open window, a possible rule is `event_start < window_end` and `event_end > window_start`. A product must also decide how to treat zero-duration and all-day entries.

Let `M` be the complete set of source IDs belonging to that scope. Let `E` be the source IDs for entries the integration currently manages in the destination. A complete reconciliation can find obsolete copies using `E minus M`.

Now let `D` be the records returned by a request for changes since a cursor. `D` usually contains only a small part of `M`, plus removal information if the protocol supplies it. Calculating `E minus D` would delete unchanged appointments merely because they were not modified recently.

![A complete membership set includes unchanged appointments. A delta includes only changes and explicit removals, so absence from a delta cannot be treated as deletion.](figure:calendar-membership-delta)

Consider three source IDs already mirrored: A, B, and C. Only B changes its start time. The delta contains B. A and C remain valid and should remain on the calendar. If C is later canceled, the client needs a removal record for C or a successful full reconciliation that establishes C no longer belongs.

## Preserve evidence that an event left the set

A query that selects only active appointments modified after a timestamp cannot describe every removal. Once an appointment is canceled, it may no longer match the active filter. Once it is deleted, there may be no source row to return at all.

There are several ways to preserve that information. A change feed can contain tombstones identifying removed records. An outbox can record changes to the destination projection. A periodic full membership pass can compare the desired set with the integration's managed IDs.

I would combine incremental updates with reconciliation for a system where missed changes are costly. The feed handles normal changes promptly. Reconciliation repairs drift from earlier failures or changes that the incremental path did not represent.

Removal records should carry enough identity to remove the correct copy without exposing fields the recipient is no longer allowed to read. A user who loses access may need an instruction to remove an event, but should not receive its newly edited description in the same payload.

The destination mapping is important here. It should relate a source identity to the destination account, calendar, and external event ID. Cleanup must operate on entries managed by this integration. A staff member's own calendar entries are outside that set, even if they resemble imported appointments.

## Treat the cursor as part of the sync scope

A cursor is meaningful for the query that produced it. Reusing one after changing the calendar, date range, or visibility policy can leave the client with a mixture of two scopes.

For an application-defined sync, I would store a scope fingerprint beside the cursor: account, calendar, selected staff, window policy, and projection or permission version. Changing a field that changes membership would trigger the appropriate rebuild or migration rather than silently reusing the old cursor.

Provider APIs have their own rules. Google Calendar returns a `nextSyncToken` for subsequent incremental reads, includes deleted entries, and requires clients to preserve the relevant query settings. The final token arrives on the final page. An invalid token produces HTTP 410 and requires a new full sync of the local representation. [Google Calendar incremental synchronization](https://developers.google.com/workspace/calendar/api/guides/sync)

Microsoft Graph's calendar-view delta is tied to a calendar and date range. Its returned `nextLink` and `deltaLink` URLs carry state that clients should preserve rather than reconstruct. Each calendar needs its own tracking state. [Microsoft Graph calendar-view delta](https://learn.microsoft.com/en-us/graph/delta-query-events)

These are provider-specific contracts. A generic adapter can expose common concepts such as upsert, remove, continuation, and completed cursor, but it should not erase differences in token expiry or supported filters.

## Commit progress only after applying it

Suppose a change round has three pages. The client applies page one and saves the final cursor too early. It then crashes before applying page two. On restart, its next request skips changes it never stored.

I would keep a completed cursor separate from an in-progress continuation. Each page can be applied transactionally with the continuation needed to resume it. The completed cursor advances only when the round has been applied successfully.

A simplified consumer could use this shape:

```text
read the current scope and completed cursor
request the next page

in a local transaction:
    upsert records by stable source identity
    apply explicit removals to managed records
    save the continuation for this page
    if this is the final page:
        replace the completed cursor
        clear the in-progress continuation
```

Repeating a page must be safe. Stable source IDs make repeated upserts possible, while repeated removals should have a defined already-absent outcome. If pages can contain multiple versions of a record, applying them also needs the ordering or revision rules specified by the feed. A local timestamp comparison is not a substitute for that contract.

This transaction protects local storage. If applying a page means making remote calendar API calls, those effects cannot participate in the same local database transaction. In that case I would first save durable outbound operations, then have a worker apply and acknowledge them. The source cursor can advance after the operations are durably recorded, while destination delivery remains separately observable.

## A failed page is not an empty calendar

Full reconciliation needs a clear completion boundary too. Imagine a source calendar with 400 managed appointments. The first page returns 100, and the second request times out. Comparing the 100 received IDs with all destination IDs would make a temporary failure look like 300 cancellations.

For a full pass, I would collect membership in a staging generation. Each successfully fetched page adds IDs to that generation. Only after the complete pass succeeds can the system consider entries missing from that generation for removal.

![Fetch and stage every page before finalizing a membership generation. A failed page leaves the previous completed membership in place and does not authorize a deletion sweep.](figure:calendar-reconciliation-round)

The staging marker alone does not provide a consistent snapshot. If records change while pages are fetched, the source protocol must define how those changes are captured. A snapshot paired with a compatible change cursor is one design. A provider's documented pagination and token semantics are another. Without that consistency contract, the application needs a conservative reconciliation policy and another pass before treating absence as final.

I would distinguish a complete empty result from a failed fetch, expired credential, or permission error. Those states have different meanings. A failure should preserve the last known state and surface a sync problem. A deliberate access revocation can require removing managed copies, but it should arrive through an explicit policy transition rather than be inferred from a network error.

## Moving windows change membership without editing events

A rolling window creates changes just because time passes. An appointment scheduled months ago may enter the window tomorrow even though its modification timestamp has not changed. An old event can leave the window in the same way.

A feed filtered only by recently modified rows will not notice either transition. The integration needs a window-maintenance process, a provider protocol that tracks that bounded view, or a broader stored dataset from which the current window is derived.

For an outbound staff calendar, I would decide whether leaving the window should delete old managed events or simply stop updating them. Both are possible product policies. The mapping and cleanup job need to reflect the chosen policy; a calendar used as a historical record has different expectations from a temporary availability view.

Time zones belong in that scope definition. A calendar month in Toronto is not the same interval as a calendar month in UTC. The service can compute precise instants for the window while preserving the event's own timezone and all-day meaning. Recurring events introduce another identity decision: a series and an individual occurrence need distinct handling, especially when one occurrence moves or is canceled.

## Timestamps need a completeness argument

A timestamp is convenient as an incremental filter, but saving the current time after a scan can skip work that commits during the scan. Equal timestamps and limited timestamp precision create additional edge cases.

An overlap window with deduplication can reduce those risks, but it does not prove completeness for arbitrarily delayed transactions. A sequence allocated before commit can also be committed out of order. Simply replacing a timestamp with an increasing database ID does not solve that problem.

For a custom protocol, I would prefer a durable change stream with a defined relationship between commit visibility and the consumer position. If that is not available, I would document the timestamp protocol's assumptions and keep full reconciliation as part of normal operation.

The cursor should represent applied progress through the source's change protocol. It should not merely say when the worker happened to finish its last attempt.

## Handle remote retries and conflicting edits explicitly

An outbound create can succeed even when its response is lost. Before retrying, the integration needs a way to recover the external identity or use the provider's supported duplicate-prevention mechanism. Otherwise a single appointment can produce several calendar entries.

Updates and removals need the same attention to ambiguous outcomes. A timeout is not proof of failure. The mapping should retain pending work until its outcome is resolved, with retries that respect provider limits and do not turn authentication failures into an endless retry loop.

Two-way sync adds conflict policy. If the appointment service and calendar both change an event, which fields may each side own? Comparing wall-clock timestamps from different systems can produce surprising results. A one-way integration can preserve source ownership; a two-way integration needs version checks, conflict handling, and a way to avoid echoing its own updates indefinitely.

I would test a small set of interleavings before optimizing throughput: cancel an already mirrored event, move it beyond the window, change its assignee, crash between pages, retry a remotely successful create, and invalidate the source cursor. I would also advance the window without modifying any records.

A useful sync status reports the last completed source round and outstanding destination operations separately. “Last attempted” is useful for diagnosing a worker, but it cannot tell the user whether their calendar is current. Keeping membership, changes, and delivery progress distinct makes that status possible.
