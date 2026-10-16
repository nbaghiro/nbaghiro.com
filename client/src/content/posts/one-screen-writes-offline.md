title: One screen writes offline
date: 2026-10-16
about: Clientbridge
cover: /img/posts/one-screen-writes-offline-wide.webp
card: /img/posts/one-screen-writes-offline-card.webp
summary: A booking app that works on a phone in a shop has to answer one question before anything else: which writes may a device make on its own? In Clientbridge the answer is almost none, and the single exception cost more to build than the feature it serves.

Clientbridge is booking, invoicing and sales tax for a service business, and it runs on the web, on an iPhone and on an Android phone in a room where the signal is whatever the building allows. Each device keeps its own copy of that business in SQLite, so the schedule, the client list and the invoices are already on the machine when the app opens. There is no spinner on the board and no request behind it.

That part is the easy half. The hard half is the other direction, and it is the decision the rest of the product hangs from: which writes may a device make on its own?

The answer here is almost none. One screen is allowed to write offline, and making that one screen safe took more code than the screen is worth on its own. This is why, and what it cost.

## Reads do not go through the API at all

Postgres is the source of truth. [PowerSync](https://www.powersync.com) sits beside it, reads the write-ahead log, and streams each device the rows that device is allowed to see, keyed by the business and the role in its token. The API is not in the read loop.

![Two directions. Reads leave Postgres through the replication log and arrive on the device, which queries its own SQLite. Writes go the other way, as a command the server settles, and then return to every device through that same log.](figure:two-paths)

The consequence that matters for the client code is that the on-device database already holds only what this user may see, so the app never filters for security. It queries its local SQLite and renders. A reactive query re-runs whenever a sync push or a local write touches its tables, so a Stripe webhook, a cron job or another staff member's action arrives on the screen in under a second without anything polling.

Two details stop that from being free. Tables that grow forever cannot all live on a phone, so messages, slots and bookings replicate for a window, the past twelve months and the next twenty-four, by month; anything older is read from the API while online. And the replica is not the same shape as Postgres: PowerSync stores each table as JSON behind a view, so the indexes are the server's indexes without their leading business column, because a device only ever reads one business.

## A booking cannot be an edit of a copy

The obvious next step, once every device has a local database, is to let people write to it and reconcile later. That is where I stopped.

Creating a booking has to establish five things at the same moment: the team member is not on time off, the business is not closed, the time is inside that member's working hours for that weekday, a class seat or the surrounding visits leave room, and any resource the service needs is free. The command takes a Postgres advisory lock on the member for the length of the write, checks all five, and writes the slot, the booking and an audit row in one transaction.

![Inside one command: an advisory lock on the member, five checks against rows another device may be changing, then the slot, the booking and the audit written in a single transaction.](figure:five-checks)

A device cannot do that. It can check those five things against the copy it holds, but the copy is a snapshot, and the rows behind it are being changed by other devices while it checks. Two phones offline in the same shop will both find the same slot free, and both will be right about what they knew.

The alternatives are worse than they look. Last write wins silently discards one of two real bookings. A CRDT merges both and produces a double-booked member, which is not a merge conflict a library can resolve, because the conflict is not in the data, it is in the world. Either way the first thing the owner learns about it is a client standing in the doorway.

So the rule in this codebase is that a server-only invariant is a command, never an edit of the replica. Four things are server-only: numbering and uniqueness, capacity and conflict, money, and anything that crosses from one business to another. Everything a command touches flows back out through the replication log to every device, so the write path ends where the read path begins and there is no second mechanism for getting the answer back.

There is no generic write endpoint. A capability is one of five surfaces, and choosing the surface is the main design decision for a new feature: replicated read, offline command, online command, webhook, or background job.

## The one exception, and why it earned it

The second surface in that list exists for exactly one screen: a team member's recurring working week.

It earned the exception because of who edits it and when. Working hours are set by someone standing in the business, often while the person they concern is in front of them, and the edit is not a contested resource in the way a two o'clock slot is. Refusing to accept it until the signal returns would be the wrong answer to a reasonable request.

So the week is a proposal. It is written into a local-only table that never replicates, and an uploader walks that table and turns each proposal into a typed command. The screen shows the proposal as pending until the accepted revision appears in the replica, which is the only confirmation that counts, because it means the authoritative row has come back the normal way.

## What one editable screen cost

Everything below exists because of that single exception.

The command carries the revision the device expected. The server takes the same advisory locks a booking takes, re-reads the member, and refuses the write if the revision moved underneath it. Nothing is merged.

Every proposal carries a device id and an operation id, and the server reserves a receipt against that pair with a hash of the payload before it does anything else. A retry with the same identity returns the first answer rather than applying the week twice. The same identity with different content is an error rather than an update. Receipts are kept for ninety days, and a proposal created outside that horizon is refused rather than applied late.

![The life of one proposal: queued and still editable, frozen the moment it is sent, accepted with a revision, and retired only when that revision appears in the replica. A refusal stops the chain and keeps the week for review.](figure:outbox-week)

On the device, the outbox is a small state machine with four states and a chain. A proposal that has not been attempted yet absorbs further edits, so holding the screen open and changing your mind three times sends one command. The moment it is sent its payload is frozen, and a new edit becomes a successor that waits for its predecessor and inherits the revision that predecessor returns. An accepted proposal is not deleted when the response arrives; it is retired when the replica shows its revision, which is what keeps the pending state honest. Transport failures back off with jitter to a five-minute ceiling and honour a Retry-After. A refusal stops that member's chain and keeps the proposal for review, with two explicit ways out: apply it again against the fresh revision, or discard it.

That is a lot of machinery for one screen. It is the whole bill for the decision, and it is worth stating plainly rather than hiding, because the alternative is the one most offline-first stacks take: allow general writes, add a merge policy, and discover the cost in support tickets instead of in code.

## The part I did not plan

The working week is what a booking was checked against. Change the week and visits already on the calendar can fall outside it.

The command answers with them. After it replaces the week it collects every pending or confirmed visit for that member in the future that now sits outside the new hours, and returns their ids with the new revision. The device stores the list and the editor shows it. Nothing is cancelled and nothing is silently broken; the owner is told which visits their edit stranded, and decides.

The same instinct refuses a week it cannot represent. If a member already has a split day, two windows on one weekday, set from somewhere other than this editor, replacing the week would flatten it. Rather than quietly dropping the second window, the command refuses and asks for the week to be reviewed.

Both of those exist because the one write allowed offline is the one that can invalidate a decision the server already made. If you are going to make an exception, the exception has to report what it broke.

## What I would tell someone starting this

Decide the write path before the data model. For every capability, ask who has to settle it, and let that answer choose the surface. Most products have a handful of operations where the server must decide and a long tail where it need not, and the tail is where offline editing pays.

Then count the cost of each exception honestly. A screen that writes offline needs an expected version, an idempotent identity, a frozen payload, a queue with ordering, a retirement rule tied to the authoritative row, and an answer for what to do when it is refused. If a feature is not worth that, it is not worth writing offline, and saying so early is cheaper than a merge policy nobody can explain.
