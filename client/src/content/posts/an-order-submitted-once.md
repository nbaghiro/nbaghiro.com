title: Submitting an order exactly once
date: 2026-10-18
about: LlamaTrade
cover: /img/posts/an-order-submitted-once-wide.webp
card: /img/posts/an-order-submitted-once-card.webp
summary: Between deciding to buy and the broker confirming, a process can die. LlamaTrade derives the order id from the signal so the broker itself refuses the duplicate, and reconciles the uncertain cases against the broker on the way back up.

There is a window in live trading where a crash is genuinely ambiguous. A strategy decides to buy, a row is written saying so, the order goes over the network, and somewhere in there the process stops. On the way back up, the row says pending. That means one of two things: the order never reached the broker, or it reached the broker and the confirmation died in transit.

Local state cannot tell those apart. Both look identical from inside the process, and they call for opposite responses. Submitting again is right in the first case and buys the position twice in the second. Doing nothing is right in the second and silently drops the signal in the first.

## The id is derived, not generated

![A signal becomes an order id by hashing the session, symbol, side and signal timestamp. The same decision always derives the same id, so the broker can recognise a repeat.](figure:derive)

The order id is not random. It is derived from the decision that produced it: the session, the symbol, the side, and the timestamp of the signal, hashed with SHA-256 and truncated to sixteen hex characters behind an `lt-` prefix.

```
lt-{sha256(session:symbol:side:signal_timestamp)[:16]}
```

The same signal always derives the same id, on this run and on any later one. An aware timestamp is converted to UTC before hashing, so the same instant expressed in any offset produces the same id; a naive one is hashed as written and read as UTC wall clock.

The important part is where that id goes. It is sent to the broker as the client order id, and Alpaca enforces uniqueness of that field per account. So the id is not only a local key. It is a claim registered at the other end of the network, in a system that survives our crash, and it means a duplicate submission is refused by the party that would otherwise execute it.

That property is what makes the rest of this tractable. Without it, every recovery decision would be a guess.

## Three answers to one question

![On resubmission the recorded order resolves three ways: already dispatched, found at the broker and adopted, or never sent and resumed on the same row.](figure:resolve)

When a signal is submitted and an order with that derived id already exists locally, the executor resolves it before touching the broker.

If the existing row carries a broker id, or has advanced past pending, the order was dispatched and the answer came back. The recorded order is returned unchanged and the replay is counted as a metric.

If the row is pending with no broker id, local state is exhausted and the broker is asked directly, by client order id. If the broker has it, our write of the response is what was lost, not the order. The broker id and status are copied onto the row, the submitted timestamp is filled in if it was missing, and the adopted order is returned.

If the broker does not have it, the order genuinely never arrived. The existing row is resumed and dispatched rather than a second row being created, so the signal is neither dropped nor duplicated and the audit trail stays single.

## Sweeping on the way up

The resolution above runs when a signal happens to be submitted again. Most stranded orders never get that, because the condition that produced them has moved on.

So a runner starting up sweeps for them. It selects every order for its session that is still pending with no broker id, and asks the broker about each one. Orders the broker has are adopted, and any terminal ledger events the fill stream missed while the process was down are emitted for them. Orders the broker does not have are marked rejected with the reason recorded, and the live runner will emit a fresh signal on the next bar if the condition still holds.

One small thing falls out of the ordering here. An order that never reached the broker never reserved cash against its sleeve, so rejecting it needs no release posting. Only the adopted ones publish anything.

If the broker lookup itself fails, that order is skipped with a warning rather than guessed at, and it stays pending for the next sweep. An uncertain order left uncertain is a worse experience than a wrong one, and a safer outcome.

## Fills are what happened

Nothing in the submission path updates a position. The executor submits, records, and keeps the originating signal in a pending map so the eventual fill can be measured against the price that triggered it. Position state comes from the broker's trade-update stream.

This is the same distinction as above, applied continuously rather than only after a crash. What we intended is a local fact and can be wrong in several ways: the order can be rejected, partially filled, filled at a different price, or cancelled before it fills. What the broker executed is the only thing that moved money, so that is what the book is built from.

## Exactly one event per order

The trading service publishes exactly one fill event per order, at terminal state, carrying the cumulative filled quantity and average price. A cancellation or expiry with a nonzero filled quantity publishes its filled portion. Partial fills publish nothing on their own.

That last rule is not a stylistic preference; it falls out of the deduplication key. The ledger derives its event id from the client order id, which is the same for every message about that order. A second partial would arrive carrying an id the ledger has already seen and be discarded. Publishing per partial would therefore record the first partial and silently lose every one after it, which is worse than not publishing them at all. So the design publishes once, when the quantity is final.

The same key makes redelivery safe in the other direction. The ledger's insert is a conflict-do-nothing on that id, so a message delivered twice is recorded once, and the at-least-once stream between the two services needs no coordination beyond the key.

## Limits

An order submitted outside a strategy, by hand through the API, has no signal timestamp to derive from and gets a random id. It is still unique at the broker and still deduplicated by the ledger, but it is not crash-idempotent: a client that retries a manual submission after losing its response will place a second order. That is the honest state of it rather than a thing I have solved.

The derivation also means that two genuinely different decisions for the same session, symbol and side at the same timestamp would collide into one order. In practice the rebalance gate evaluates a strategy once per period and once per calendar day, so there is one decision per symbol per cycle, but the id is only as unique as that gate makes it.

Recovery is scoped to a session. The sweep runs for the session starting up, so an order belonging to a session that is never restarted stays pending until a periodic status sync reaches it.

The deterministic derivation is pinned by 10 cases, covering stability across calls, the format and its length against the broker's field limit, every input changing the id, microsecond differences changing it, and equal instants in different offsets deriving the same id. Recovery is pinned by 9, covering each branch of the resolution and both outcomes of the sweep. All 19 pass as of 18 October 2026.

The attribution side of this, how a fill becomes balanced postings against the sleeve that asked for it, is in [One brokerage account, several strategies](https://nbaghiro.com/blogs/one-account-many-strategies).
