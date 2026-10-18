title: Offline reads and a queued working-week edit
date: 2026-10-02
about: Clientbridge
cover: /img/posts/one-screen-writes-offline-wide.webp
card: /img/posts/one-screen-writes-offline-card.webp
summary: Clientbridge reads replicated business data locally, while the server settles bookings and financial commands. Working-week edits use a local queue with revision checks, retry identities and confirmation through replication.

Clientbridge combines booking, invoicing and payments for service businesses. Its web and mobile clients keep a local replica of business data so they can read information already synced to the device when the connection is poor.

That does not mean every action can be completed offline. A booking needs to be checked against other bookings, working hours and resource availability. A local copy may not include a change another device has just made.

The design separates local reads from authoritative writes. Most writes go through server commands. The working-week editor has a narrower offline path: it queues a proposal for the server to accept or reject later.

## Reading the local replica

Postgres is the source of truth, and PowerSync replicates the rows selected by the application's sync rules into local SQLite. The client queries that replica for the data it holds. Changes arriving through sync can update reactive queries without a separate polling loop for each screen.

![Replicated data travels from Postgres to local SQLite. Commands go to the server, and their resulting changes return through replication.](figure:two-paths)

This improves access to already-synced data, but it does not guarantee that every screen opens instantly or that no read ever uses an API. Initial synchronization, missing data and older history still need handling.

The code subscribes to a moving window for time-based history: twelve months back and twenty-four ahead. Older records can be requested online. Other replicated tables have different retention needs.

Access control is enforced through server authorization and sync selection. The frontend also has scoping helpers. Local filtering should not be treated as the security boundary, and a local replica is not permission to skip authorization when a command reaches the server.

## Why booking is a server command

A booking can conflict with staff availability, opening hours, other visits, class capacity or a required resource. The booking service checks those conditions against authoritative data and uses transaction-scoped locks where the write needs coordination.

![A simplified booking command: coordinate the write, check availability and capacity, then record the accepted booking and its audit information.](figure:five-checks)

A device can help someone choose a time using its replica, but cannot confirm that another device has not reserved it in the meantime. Two disconnected devices may both see the same opening.

A merge strategy alone does not decide which booking the business should honor. That is a product and consistency decision. In Clientbridge, the server decides whether the booking can be accepted; the resulting records then return through replication.

The same principle applies to other server-owned constraints, including financial operations, uniqueness and cross-business actions. Their commands do not directly edit the client replica and hope to reconcile later.

## The working week is a proposal

The working-week editor can save a local proposal when it cannot reach the server. The proposal lives in a local-only outbox table and carries the expected revision of the staff member's hours.

An uploader sends it as a typed command. The server checks authorization, takes the relevant locks, and compares the current revision with the one the device expected. If another change has already advanced the revision, the command rejects the proposal for review rather than merging it silently.

This makes the offline action precise: the device has saved an edit to be submitted. It has not confirmed that the business's working hours have changed.

## Retries need a stable identity

Each proposal carries a device identifier and an operation identifier. The server records a receipt tied to the operation and a hash of its content.

A retry with the same identity and payload can recover the recorded result without applying the change again. Reusing the identity with different content is rejected. The receipt logic also has a ninety-day retry horizon, so an old proposal cannot be replayed indefinitely.

On the device, edits can be combined while a proposal is queued and has never been attempted. Once an attempt starts, the payload remains fixed. A later edit becomes a successor in the queue, using the revision returned by its predecessor when appropriate.

![An edit moves through queued, sending and accepted states, or is rejected for review. An accepted edit is retired after its revision appears in the replica.](figure:outbox-week)

The response is not the end of the pending state. An accepted proposal stays in the outbox until the local staff record has reached at least the accepted revision. That prevents the interface from dropping the pending edit before the authoritative data has arrived through sync.

Transport failures use backoff with jitter and bounded Retry-After handling. A rejected proposal stops that chain for review. The user can decide whether to apply a revised proposal or discard it.

## Checking the effect on existing bookings

Changing working hours can leave future visits outside the new week. The command looks for pending or confirmed bookings affected by the change and returns their identifiers.

It does not automatically cancel those bookings. The editor can show the affected visits so the business can decide what to do with them.

The command also rejects a week containing split-day hours that this replacement operation cannot safely represent. That avoids silently flattening two working periods into one.

These checks make the proposal more than a delayed update. The server validates both whether it can apply the change and what existing work needs attention afterward.

## The boundary matters more than the queue

The queue needs ordering, stable payloads, retry identities, revision checks and a clear rule for confirmation. It also needs a usable response when the server refuses an edit.

That is a meaningful maintenance cost, even for one editor. It should be weighed against the value of accepting that particular action while disconnected.

For Clientbridge, local reads cover much of the day-to-day use, while the server retains decisions that depend on shared capacity or financial state. Working-week edits use a queued proposal because their acceptance can be deferred and their conflicts can be presented for review. Other offline actions would need their own justification and conflict behavior.
