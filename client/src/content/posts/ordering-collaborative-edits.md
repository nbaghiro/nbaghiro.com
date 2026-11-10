title: Keeping collaborative edits in order
date: 2026-11-10
about: Engineering
cover: /img/posts/ordering-collaborative-edits-wide.webp
card: /img/posts/ordering-collaborative-edits-card.webp
summary: How Galleo orders document changes, retries a lost acknowledgement, and switches between WebSocket and HTTP saves, with the limits of an in-memory room.

Two people editing the same document create several different problems. Their changes need an order. A saved change needs to reach the other person. A disconnected browser needs to recover without applying its last change twice. The editor also needs to explain when someone else is already typing in the same element.

In [Galleo](https://galleo.app), these jobs are split between an in-memory room, a transactional document write, and the browser's save coordination. The implementation uses server-ordered operations with per-key last-writer-wins. It does not merge simultaneous typing character by character.

That scope matters. Two people changing different properties can work independently. Two people rewriting the same paragraph need coordination, and a stale structural change may need to be refused. Here is how those cases travel through the system, and where the current design stops.

## Start with the unit of change

Suppose Alice changes a title's colour while Ben changes its text. Replacing the entire section for each edit would make their unrelated changes compete. Galleo instead has a `data` operation addressed by section ID and element ID, containing only the keys being changed.

```json
{
  "kind": "data",
  "sectionId": "intro",
  "elementId": "title",
  "keys": { "color": "#34554b" }
}
```

This merges the named properties into that element's data. A later text operation leaves the colour alone. If both people change the colour, the value applied later wins. “Later” means the server's application order, not a timestamp supplied by either browser. A null value removes a property, so an inverse operation can represent a key that did not previously exist.

The editor derives section differences, then runs `narrowOps` to turn suitable section replacements into per-element data changes. This central step covers several editing interfaces without asking each one to implement its own merge policy. Changes to structure remain broader operations: adding a child or replacing a section does not become an independent property edit just because that would be convenient.

## One room queue, one database revision

An open artifact has a room in the server process. The room holds connections, presence, leases, a recent-operation buffer, and a promise chain for incoming socket writes. Each batch waits for the previous batch's apply-and-publish step to finish.

For a new write, `applyContentOps` locks the artifact row with `FOR UPDATE`, reads its current content, applies the operations, derives the stored content fields, and increments `artifacts.seq`. The content and revision commit together. PostgreSQL's row lock prevents another writer from modifying that row until the transaction ends; a competing locker waits. This is a database boundary, independent of which browser sent the request. [PostgreSQL's locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS) describes that behavior.

The queue and the row lock have different jobs. The row lock protects the document read-modify-write. The room queue keeps socket batches' application and subsequent notifications in the same order. After the write returns successfully, the sender receives an acknowledgement with its client tag and committed sequence. The other connections receive the operations with that sequence and author.

![Two socket edits enter one room queue. Each commits a document revision before acknowledgement and broadcast.](figure:collab-ordered-writes)

If Alice's colour change becomes revision 81 and Ben's text change becomes 82, peers receive those new socket writes in that order. Neither browser needs to compare its wall clock with the other person's.

There is a boundary to this guarantee: HTTP saves publish into the room after their own database write, through a separate `publish` method. That method does not join the socket promise chain. The row still serializes content writes, but I would not describe the room as a universal ordering service for every possible writer. Concurrent HTTP publication and socket publication deserve their own ordering tests and, if needed, a common publication path.

## A failed write must not stop the queue

A promise chain has an easy failure mode. If one link rejects and later work is attached only with success callbacks, those later callbacks are skipped. The room could keep accepting frames while applying none of them.

Galleo catches exceptions from the write dependency inside `applyOne`. A thrown database error becomes a rejected batch with a save-failure message. The next queued batch can still run. A catch on the queue tail provides another guard against a rejected chain.

This is tested with a write that throws followed by another write that succeeds. The failure produces no operation broadcast. Conversely, if the sender disconnects while its write is running and that write succeeds, the room still publishes it to the remaining peers. Losing the sender does not undo a committed change.

This ordering also creates a throughput tradeoff. A slow write delays other socket writes to the same artifact. Separate artifacts have separate room queues, but the implementation does not make an individual busy document infinitely parallel.

## Retry the batch under its original identity

Consider a different failure: the database commits revision 81, then the connection drops before Alice receives its acknowledgement. Her browser cannot tell whether the change was saved.

Each identified batch carries a `mutationId` and the `baseSeq` it was made against. A retry keeps that identity even when it moves from WebSocket to HTTP. Under the artifact row lock, the write function checks `artifact_mutations` for an existing receipt. If one exists for that artifact and mutation ID, it returns the stored result instead of applying the operations again.

The receipt and the document update are written in the same transaction. The receipt includes a hash of the operations and accompanying document settings; reusing an ID for different content returns a conflict. Two deliveries racing each other therefore meet the same lock and receipt check.

This is bounded deduplication of the database effect. It is not a promise that every network message arrives once. Receipts are pruned after seven days, the identity fields are optional at the server boundary, and the room's publication method is not itself a durable deduplication log. Those qualifications are more useful than calling the entire system “exactly once.”

Structural operations have another check. When an identified batch supplies `baseSeq`, an insert, removal, or section replacement is refused if the document has advanced. Per-key data operations deliberately allow a stale base under the last-writer-wins policy. The distinction prevents a structural replacement from silently overwriting a tree the editor never saw, while preserving independent property edits.

## Disconnect recovery changes the save driver

The browser has two persistence paths, with one active at a time. While the socket is ready, its acknowledgements advance the saved baseline and the debounced HTTP save stands down. When the socket drops, outstanding batches pass to HTTP in order under their original identities. The remaining diff then follows from the last acknowledged content.

On reconnect, the client flushes the HTTP path before sending its room hello. A newly opened socket does not immediately become the save driver. Otherwise a save still pending over HTTP could race the resumed socket flow.

The editor also clears its pending-key map on a socket drop. While connected, that map prevents a remote value from overwriting a local property that is still awaiting acknowledgement. Keeping those entries after losing the socket would make the browser continue ignoring remote changes for keys it no longer has an active acknowledgement path for.

![A lost acknowledgement leads to a retry with the same mutation ID. Reconnecting flushes HTTP saves before requesting recent room history or a fresh document.](figure:collab-reconnect-path)

The room keeps the last 256 operation broadcasts in memory. A returning client supplies its last sequence. The room replays a covered recent gap or requests a resync when it cannot cover the starting revision. A whole-document replacement clears the buffer and asks peers to reload. A process restart also loses this history, so recovery requires a fresh document read rather than replay from a durable operation log.

The browser has an additional recovery journal in IndexedDB, bounded to 5 MB per artifact and partitioned by account, workspace, and artifact. It retains unacknowledged batches for an explicit recovery flow. This is separate from ordinary saving: recovering an old structural batch may produce a conflict that the person must decide how to handle.

## Presence and leases have a smaller promise

A cursor position is useful briefly. It does not belong in the document's durable history. Presence is sent as current state, throttled and coalesced in the browser. Cursor coordinates refer to an element or section and fractions within it, so another viewport can resolve them against its own layout.

Presence, selection outlines, and editing indicators are editor overlays. They never enter the content tree rendered for a presentation or export. This keeps collaboration UI from becoming accidental document content.

An editing lease helps avoid two people typing in the same element. The room arbitrates claims by section and element ID, with ownership attached to a connection. A second tab belonging to the same person still counts as a separate claimant. A release, disconnect, or presence timeout frees the lease. Connections silent for 30 seconds become eligible for eviction during the server's sweep, rather than retaining the element indefinitely.

The lease is advisory for writes. The server does not reject content operations merely because another connection holds that element. HTTP fallback and recovered batches still need a route through the write pipeline. This means the lease reduces conflicting interactions but cannot substitute for operation semantics. Simultaneous text changes can still overwrite one another under the per-key policy; there is no character-level merge underneath.

## Access can change while the socket stays open

Checking access at WebSocket upgrade is necessary, but a collaborator can be demoted or removed later. Galleo's access-change routes re-resolve affected users and update their open room connections. Dropping below edit releases their leases and changes their roster entry. Losing access entirely closes the connection.

Subsequent socket writes are rejected at the room's write entry point. There is an important remaining edge: an already queued write is not re-authorized inside `applyOne`. I would treat revocation racing with queued work as a separate boundary to strengthen, rather than claim revocation cancels every operation already accepted. Checking current authorization at the final write boundary would make that policy explicit.

## What changes with a second server process

The room registry is a process-local map. A second server would have different members, leases, queues, and replay buffers even if both processes used the same database. The database lock still protects the artifact row. It does not distribute cursor updates or make every peer observe the same notification stream.

A shared fanout channel would address notification delivery between processes, but additional work would remain: how to order publication across writers, coordinate leases, recover missed notifications, and reconcile permission changes. A durable operation log or transactional outbox could make committed changes replayable after a process failure. These are possible extensions, not guarantees of the current implementation.

The tests I rely on cover the smaller boundaries directly: two clients merging different keys, later writes replacing the same key, a throwing write leaving the queue usable, a disconnected sender's committed change reaching peers, and the handover between save drivers. They make the implemented behavior understandable without implying that every distributed failure has been solved.

For this editor, server-ordered operations provide a workable collaboration model with a clear cost: short-lived room state, explicit resynchronization, and limited same-element merging. Understanding those limits is part of deciding whether this design fits the next feature.
