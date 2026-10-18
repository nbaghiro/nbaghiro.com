title: Recovering an order after a restart
date: 2026-10-18
about: LlamaTrade
cover: /img/posts/an-order-submitted-once-wide.webp
card: /img/posts/an-order-submitted-once-card.webp
summary: LlamaTrade uses a stable id to match a strategy signal to a broker order after a restart. Recovery checks the broker, while the ledger handles repeated fill records separately.

An order can reach the broker before the process sending it records the response. If the process stops in that interval, the local row may still say pending even though the broker has accepted the order.

That row alone is not enough to decide what to do next. Sending a new order could repeat the purchase. Abandoning the request could leave a strategy decision unexecuted. Recovery needs a way to identify the original order at the broker.

## Deriving an id from the signal

![The session, symbol, side and signal timestamp produce a stable client order id that can be used to look up the broker order.](figure:derive)

For strategy orders, LlamaTrade derives the client order id from four inputs: the session, symbol, side and signal timestamp. It hashes their representation with SHA-256 and uses the first sixteen hexadecimal characters after an `lt-` prefix.

```
lt-{sha256(session:symbol:side:signal_timestamp)[:16]}
```

Repeating those inputs produces the same id. Timestamps with a timezone are converted to UTC before hashing, so different offsets representing the same instant match. Timestamps without a timezone are treated as UTC wall-clock values.

The executor sends this value as Alpaca's `client_order_id`. Alpaca supports [looking up an order by that id](https://docs.alpaca.markets/us/reference/getorderbyclientorderid), and rejects duplicate client order ids. That gives the application a way to match its local record to a broker record after a restart.

## Resolving an existing record

![The retry path returns an existing record, adopts a matching broker order, or resumes the local row when the lookup returns no match.](figure:resolve)

When the same strategy signal is submitted again, the executor first looks for its derived id locally.

If the row already has a broker id, or its status has moved beyond pending, the executor returns the recorded order. A non-pending status can include rejection, so this branch does not necessarily mean the broker executed anything.

If the row is pending without a broker id, the executor looks it up at the broker. When a match is returned, the broker id, status and available timestamps are copied into the local record. The application can then continue from the broker's response.

When that lookup returns no match, the current retry path resumes submission using the existing row and the same client order id. A lookup error propagates instead of being treated as an absent order.

This is the implemented recovery rule, not proof that every uncertain request is safe to repeat. In particular, a timeout does not establish that an order failed. Alpaca's [timeout guidance](https://docs.alpaca.markets/us/docs/working-with-orders#faq) says to obtain confirmation before resubmitting a timed-out order. The code's no-match branch needs to be assessed against that guidance and the broker's behaviour during an unresolved submission.

## Checking pending orders at startup

A signal may not be submitted again, so the runner also checks its session's pending orders during startup. It selects rows without a broker id and looks up each client order id.

A matching broker order is adopted. If it has reached a terminal state, recovery can also publish the ledger information that may have been missed while the process was down.

If the lookup returns no match, startup recovery marks the row rejected and records a reason. Unlike the retry path, it does not resubmit that row. If the lookup fails, the row remains pending and the failure is logged.

These branches preserve a distinction between a lookup that returned no match and a lookup that could not complete. They still depend on what the broker can establish about the original request at that point.

## Recording fills

Submission records an order request. Positions and ledger entries need the quantities and prices the broker actually filled. An order can be rejected, partly filled, cancelled or filled at a different price from the one available when the strategy evaluated it.

For the ledger, the trading service builds a cumulative fill record when the order reaches a terminal state. A filled order includes its total filled quantity and average price. A cancelled or expired order with a nonzero filled quantity includes that filled portion.

Partial fills do not produce separate ledger fill records in this design. The ledger derives its fill event id from the client order id. If each partial were published under that same identity, later partials would be treated as duplicates of the first.

Recovery and status synchronisation can publish a terminal fill record again. The ledger's insert ignores an existing event id, so repeated delivery does not create another copy of that fill record. This is deduplication at the ledger; it does not require a message to be published exactly once.

## Limits of the current design

Manual submissions have no strategy signal timestamp and receive random ids. A repeated manual request can therefore create a new order. It does not have the same retry protection as a repeated strategy signal.

The derived id also groups requests by its four inputs. Two requests with those same inputs resolve to the same identity even if another field, such as quantity, differs. Callers need to use the signal timestamp consistently.

The recovery tests cover the local branches with broker responses supplied by test doubles. They check how the application handles a known order, a no-match response and a lookup failure. They do not establish the outcome of every network failure or broker race. That is why this describes recovery and deduplication rather than an end-to-end exactly-once guarantee.

The related article [One brokerage account, several strategies](https://nbaghiro.com/blogs/one-account-many-strategies) explains how fills are attributed to the strategy that requested them.
