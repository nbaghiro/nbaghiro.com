title: One brokerage account, several strategies
date: 2026-10-21
about: LlamaTrade
cover: /img/posts/one-account-many-strategies-wide.webp
card: /img/posts/one-account-many-strategies-card.webp
summary: A broker reports one position per symbol. LlamaTrade keeps an append-only double-entry ledger so each strategy's share of that position, and its own capital, stay separable.

LlamaTrade runs trading strategies against a brokerage account. I built it for my own research and I am the one using it, so this is a piece about keeping records straight rather than about what to trade or what any of it returned.

A broker account holds one position per symbol and one cash balance. If two strategies and I all buy the same symbol, the broker reports a single holding. It has no way to say that part of it was opened by one strategy, part by another, and part by hand.

Three things still have to be true. Every holding has to carry where it came from. One strategy must never sell shares that belong to another strategy or to me. And each strategy has to size against the capital it was given rather than against everything in the account.

The straightforward approach is to let each strategy read the broker's aggregate position and reconcile against it. That double counts capital, because every strategy sees the same cash as available, and it lets two strategies fight over a symbol they both hold.

## Sleeves over one account

![One brokerage account partitioned into sleeves: unallocated cash, a manual bucket, holdings that arrived from outside, and one sleeve per running strategy. The same symbol can appear in more than one sleeve.](figure:one-account)

The account row is the unit of broker reality and the anchor for reconciliation. Underneath it are sleeves, which are virtual sub-portfolios. There is one per running strategy, one for trades I make by hand, one for free cash that has not been allocated, and one called unmanaged for holdings that already existed when the account was connected or that turn up later without the system originating them.

A strategy sleeve stores one balance: the capital allocated to it. Its cash, positions and reserved amounts are deliberately not columns. They are derived.

That is the design decision the rest of this follows from. Keeping a positions table, a cash table and a lots table, each mutated in place, means keeping several mutable records in agreement forever. Instead there is one append-only event log per account, and every per-sleeve figure is a fold over it.

## Why the log is double-entry

Each event expands into balanced postings whose signed dollar amounts sum to zero, across four buckets: a sleeve's cash, its position value at cost, realized profit and loss, and an external bucket for money entering or leaving the account. The writer builds the postings and rejects the append if they do not balance.

Conservation is then something the system can check continuously rather than assume. Two invariants are stated directly: the sleeve quantities for a symbol sum to the broker's quantity, and the sleeve cash balances sum to the broker's cash.

Appends are idempotent. An event id is the first sixteen bytes of a SHA-256 over a stable key, cast to a UUID, and the insert is a conflict-do-nothing, so at-least-once delivery records effectively once. A restarted process seeds from a saved fold and applies only the events after it. That checkpoint is derived data and can be deleted at any time, in which case the next projection folds from zero.

## A fill arriving

![A fill from the broker is attributed to the sleeves that asked for it, and becomes balanced postings in the event log. Per-sleeve lots are projected from the log rather than stored.](figure:fill-to-lots)

When several sleeves trade the same symbol in one cycle, their intents are bunched into one net broker order. Offsetting intents cross internally, so a symbol one sleeve is buying and another is selling in equal size produces no broker order at all, and both sleeves still receive their allocation.

Orders carry a deterministic id. For a live signal it is `lt-` followed by a SHA-256 prefix over the session, symbol, side and signal timestamp, so the same signal always produces the same id. The broker enforces uniqueness of that id per account, which means a retry after a crash resolves to the order already placed instead of placing a second one. Orders not keyed off a signal use a random id and do not get that property.

The trading service emits exactly one fill event per order, at its terminal state, and the ledger derives the event id from the order id. One consequence follows directly: partial fills are never published on their own, because the second partial would carry the same event id as the first and be discarded as a duplicate. The cumulative filled quantity and average price are what arrive.

A holding is the sum of lots across sleeves, where a lot is a quantity of one symbol opened by one order in one sleeve with its own cost basis. A lots table exists in the schema but is intentionally neither written nor read at the moment: lots are projected from the log and materialized into per-sleeve snapshots for the read side. When a sell needs a cost basis, the ledger selects lots first in, first out against that projection, so a sleeve only ever closes its own lots.

Sizing uses sleeve equity, meaning that sleeve's cash plus the market value of its own positions, and scales a buy down to its free cash rather than overdrawing. That is the part that fixes the double counting.

## What the checksum cannot catch

Balanced postings prove that one event moves value without creating or destroying it. They say nothing about whether the running total is possible. A sleeve can hold negative cash, or have more cash reserved against open orders than it holds, or show a short position the ledger never opened, and every individual event along the way can still balance.

So there is a second set of checks over the projection, and the response depends on where the write came from. A synchronous operation such as funding a sleeve, closing one, or applying a corporate action raises and rolls back, because it is a request that can simply be refused. A fill cannot be refused, since it already happened at the broker. That path freezes the sleeve instead, and trading's risk check rejects orders on a frozen sleeve until someone reviews it.

## Where the model meets the account

The ledger is a model of the account. The broker is authoritative for aggregate reality; the ledger is authoritative for attribution. Reconciliation compares the two and classifies each difference, and what happens next is deliberately asymmetric.

If the broker holds something the ledger does not, the trade came from outside the system. It is attributed to the unmanaged sleeve and priced at the broker's average entry, which is the only cost information available for it, and the invariant heals. If the ledger believes something the broker contradicts, nothing is corrected automatically. Every sleeve holding that symbol is frozen, the freeze is recorded as an event, and a person unfreezes it after looking. Differences below a small fractional tolerance are treated as rounding dust.

The accounting model is the easier half of this. The work has been in deciding what the system may do on its own when its records and the broker's disagree, and so far the answer is that it can heal in one direction and has to stop in the other.
