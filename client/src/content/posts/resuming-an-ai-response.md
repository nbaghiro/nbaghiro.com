title: Resuming an AI response after a disconnect
date: 2026-11-10
about: Engineering
cover: /img/posts/resuming-an-ai-response-wide.webp
card: /img/posts/resuming-an-ai-response-card.webp
summary: Redis Streams, SSE event IDs, turn boundaries, and terminal-state recovery in FlowMaestro, including the limits of retention, failed appends, and browser acknowledgements.

An agent can keep generating a response while the browser loses its connection. When the browser reconnects, it needs the events produced during that gap. Starting a second generation would repeat work and could produce a different answer.

In [FlowMaestro](https://flowmaestro.ai), the agent execution stream uses a Redis Stream as its event log. The API reads that log and sends entries to the browser as server-sent events. A Redis entry ID becomes the SSE event ID, which gives the next connection a position to resume from.

The useful details are in the boundaries around that cursor: which events are retained, where a new conversation turn begins, how a finished execution is recovered, and what the browser actually acknowledges. This article focuses on the agent execution SSE route. Other streaming routes have their own behavior.

## Keep an event history separate from live notifications

Redis pub/sub delivers messages to connected subscribers. It does not retain a backlog for a subscriber that was absent. That makes it useful for live notifications, but insufficient by itself for replaying an interrupted response. [Redis pub/sub delivery semantics](https://redis.io/docs/latest/develop/pubsub/)

FlowMaestro's agent event emitters publish notifications and append corresponding events to a per-execution stream. An entry contains an event type, such as `token` or `completed`, and the JSON payload that the SSE route sends. The execution stream reader uses the log for both replay and following new entries; it does not switch from a historical read to pub/sub partway through the connection.

That removes a difficult handoff. If an implementation reads history and only then subscribes to live messages, an event can arrive between those operations. A single cursor through one stream gives the reader the same continuation rule before and after it catches up.

The stream is keyed by execution ID. The route first verifies that the execution belongs to the authenticated user and the requested agent. Possessing a cursor does not grant permission to read the execution. That check remains necessary on every new HTTP connection.

## Give the browser a position it can return

Suppose the browser has received entry `1700000000000-7`. Its connection drops. The worker appends entries ending in `-8`, `-9`, and `-10` while the browser is away.

On reconnect, the browser sends `Last-Event-ID: 1700000000000-7`. The API asks Redis for entries after that ID and relays the three retained entries. The worker continues the same execution throughout.

A token event on the wire looks like this illustrative example:

```text
id: 1700000000000-8
event: token
data: {"executionId":"example-execution","token":"continued text"}

```

The blank line ends the event. The HTML standard defines how `EventSource` tracks event IDs and includes the last ID when reconnecting. This automatic behavior belongs to that `EventSource` instance; creating a new object after a page reload does not restore an application checkpoint by itself. [Server-sent events standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)

![The browser reconnects with its last event ID, and the API reads retained entries after that ID from the same execution log.](figure:sse-resume-cursor)

The current frontend leaves a transport interruption alone while `EventSource` is reconnecting. It distinguishes a browser connection error from a server-sent `error` event carrying a JSON payload. A terminal application error closes the connection deliberately. Treating every transport error as terminal would disable the browser's reconnection behavior.

## Use the same read loop for replay and waiting

The reader uses a command shaped like this:

```text
XREAD COUNT 500 BLOCK 15000
STREAMS agent:exec:<execution-id>:events <cursor>
```

When later entries already exist, the read returns them. When the reader has caught up, it can wait for new entries. `XREAD` returns IDs greater than the supplied position, so advancing the cursor to the last returned entry is the continuation rule. [Redis XREAD](https://redis.io/docs/latest/commands/xread/)

Each SSE connection gets a dedicated Redis reader connection. A blocking read occupies that connection while waiting, so sharing it with the writer would delay unrelated commands behind the wait. Disconnect cleanup closes the reader and stops the HTTP keepalive timer.

The read batch contains up to 500 entries, and the route uses a 15-second blocking window. On an empty result, it checks the execution record before waiting again. The HTTP side also sends keepalive comments every 15 seconds. Those comments help keep an idle connection active; they do not represent progress in the agent and do not advance its replay cursor.

This is a broadcast-style read model: each browser has its own position and reads the events it needs. A worker-queue design in which consumers divide entries among themselves would have different semantics. Two open views of the same response both need the response events.

Dedicated connections have a capacity cost. A large number of open browser streams means a large number of blocked Redis readers, HTTP connections, and periodic status checks. Connection counts and idle reads belong in capacity planning alongside token throughput.

## Decide where a fresh connection starts

A connection without `Last-Event-ID` needs a separate policy. Replaying every turn of a long conversation into a view that already loaded its history could duplicate earlier messages.

The event log stores a marker for the latest user-message entry. For a running execution, a fresh connection starts after that marker. Before there is a marker, it starts at `0-0`. The user message itself is excluded from that replay because its ID is the position to read after.

The append operation uses a Lua script to add the entry, refresh the stream expiry, and, when the entry is a user message, update the turn marker. [Redis runs the script atomically](https://redis.io/docs/latest/develop/programmability/eval-intro/), so another Redis command cannot interleave between those operations. The marker therefore names the stream entry created by that append.

The lookup at connection time is less strongly coupled. The code reads the latest stream entry and the turn marker in parallel commands, rather than taking an atomic snapshot of both. A new turn beginning during that lookup can change what the two reads observe. If a product requires a strict turn boundary under that race, a turn ID in the request or an atomic resume-point lookup would make the contract more explicit.

A page reload also needs the application to load its stored conversation state. Replaying from the current turn is not a replacement for loading previous turns, and returning a terminal event is not a replay of every token that led to it.

## Recover completion from the execution record

The log recognizes `completed` and `error` as terminal event types. If a fresh connection finds a terminal entry, the server sends it and closes the connection. When a following reader encounters one, it does the same.

There is also a fallback when the log is missing or no longer has the terminal event. The route checks the execution record. For a completed execution, it finds the final assistant message from stored history or messages and sends a completion payload. Other non-running states produce an error payload with the recorded status or error.

![A retained cursor resumes the log. A fresh connection uses the current turn. When the log is unavailable and execution has finished, the database supplies the final result.](figure:sse-recovery-paths)

This lets a browser recover a completed answer even when the token-level history has expired. The final message is a different form of recovery from replaying intermediate tool events and partial text. The interface should use the final result to reconcile its display rather than assume every earlier event must have arrived.

The terminal helper waits 500 milliseconds before closing the HTTP response. That is a practical delay to let output flush, not an acknowledgement from the browser. A disconnect can still occur before the client handles the terminal event, which is why sending it again on a later connection is useful.

## Retention makes replay a bounded promise

The implementation uses approximate trimming at 20,000 entries per execution and a 24-hour stream expiry refreshed by each append. This bounds storage, but it also limits how far back a client can resume.

An entry count is not a byte budget. Small token payloads and large tool results can occupy very different amounts of memory. A capacity estimate needs typical payload sizes and active execution counts, not just the configured number of entries.

The turn marker has its own expiry, refreshed when a user message sets it. The stream expiry is refreshed on every append. An unusually long turn can therefore outlive its marker even while its stream remains active. A fresh connection then starts from the beginning of the retained stream rather than from that lost marker.

The current reader does not explicitly detect that a reconnect cursor predates the earliest retained entry. It can return the remaining entries without reconstructing the missing prefix. I would add a clear recovery response for that case: reload the stored message state, then reconnect from a known point. Quietly showing a suffix as though it were a complete response would be misleading.

The route also accepts a nonempty cursor without first validating its Redis ID shape or checking whether it is ahead of the stream. A malformed cursor can fail the read; a future cursor can wait past events the client needs. Validation and a documented reset behavior would make recovery easier to test and operate.

## A successful stream append is still only one part of delivery

The append helper catches and logs failures so a logging problem does not fail the agent execution. Pub/sub publication and stream append are separate operations. There is no transaction making them succeed together.

A notification might reach a live pub/sub subscriber while its log append fails. The execution SSE route reads the log, so that event would be missing from its replay and live-follow path. This is why I would not describe the implementation as lossless streaming. The database fallback can recover a final answer when one was saved, but it cannot recreate every missing intermediate event.

Redis assigning an ID also does not deduplicate a producer retry. Appending the same logical event again creates another entry with another ID. A stable logical event ID or message sequence can be needed when retries must not repeat text or tool-state transitions.

On the browser side, receiving an SSE ID means the transport parser advanced. It does not establish that an application callback successfully updated state. The current frontend catches several parsing and callback errors without requesting replay. For stronger delivery requirements, I would use idempotent reducers, message-level sequence checks, and reconciliation against saved final content rather than treating the SSE cursor as a business acknowledgement.

## Test the interruption paths directly

The existing helper tests cover entry parsing, missing streams, current-turn selection, and terminal resume points. Route tests check ownership and authentication. Those are useful checks, but mocks do not establish behavior across a real network interruption or Redis expiry.

The next tests I would prioritize are a disconnect between two token entries, completion while the browser is offline, replay after trimming, a failed append followed by later successful appends, and a new turn arriving during resume-point lookup. A browser test should also confirm that a transport error leaves `EventSource` able to reconnect while a terminal application error closes it.

Operationally, I would measure append failures, replayed entry counts, reconnect frequency, oldest retained IDs, active readers, and recoveries from the execution record. Those measurements distinguish a slow agent from a broken delivery path.

The design gives the execution a retained sequence that outlives an individual HTTP connection. Its limits remain explicit: replay depends on successful appends and retained entries, while durable final state provides a separate recovery path. Keeping those responsibilities distinct makes both the interface and the failure handling easier to explain.
