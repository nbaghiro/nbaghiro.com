title: Checking ledger balances after a fill
date: 2026-10-20
about: LlamaTrade
cover: /img/posts/checking-ledger-balances-after-a-fill-wide.webp
card: /img/posts/checking-ledger-balances-after-a-fill-card.webp
summary: How LlamaTrade checks both an event's postings and the balances derived from it, with separate handling for rejected requests, recorded fills and fills that need quarantine.

LlamaTrade divides a brokerage account into virtual sub-portfolios called sleeves. Each strategy has its own sleeve, so its cash and holdings can be tracked separately even when several strategies trade the same symbol.

The ledger has to preserve that attribution when something goes wrong. A broker fill can arrive that leaves a sleeve with negative cash. Ignoring the fill would leave the local record incomplete, while continuing to trade from that balance would compound the problem.

The implementation handles this through several checks at different stages. The writer checks the event's postings. The projection checks the resulting balances. The fill handler can record the fill and freeze the sleeve, while synchronous requests can be refused before their transaction commits.

This article follows those checks through a small example. The wider account and sleeve model is described in [One brokerage account, several strategies](https://nbaghiro.com/blogs/one-account-many-strategies).

## An event can balance while cash becomes negative

Suppose a sleeve has $1,000 in cash. A buy fill arrives for twelve shares at $100 each, with no fees in this example. The purchase costs $1,200.

The postings for the fill are:

```
Cash                    -1,200
Position value at cost  +1,200
Fees                         0
------------------------------
Sum                          0
```

The event balances. Its position posting adds shares and cost with the same sign. Both checks in the posting validator pass.

Applying it to the sleeve produces a different question:

```
Starting cash             1,000
Cash movement            -1,200
------------------------------
Resulting cash             -200
```

That resulting cash balance violates the ledger's current rules for a sleeve. The event check and the balance check are both useful, but neither replaces the other.

![The same buy has balanced postings totaling zero and leaves the sleeve with negative 200 dollars of cash.](figure:ledger-two-checks)

The numbers are illustrative. They describe a state the ledger is intended to detect, rather than an ordinary order that its pre-trade checks should permit. The example was run through the repository's posting builder, event fold and invariant checker for this article.

## What the writer checks

`LedgerWriter.append` builds postings from the event type and payload before inserting an event. `assert_balanced` requires the signed dollar amounts to sum to zero.

It also checks the relationship between a position's quantity and cost movement. A posting that adds shares while removing cost, or removes shares while adding cost, is rejected. Zero-cost quantity changes are exempt from that sign check because an operation such as a stock split can change quantity without adding cost.

The writer then inserts the event using `ON CONFLICT (event_id) DO NOTHING`. If that identifier already exists, it returns the existing row and reports that no row was inserted.

This prevents a repeated event ID from adding another movement to the ledger. It does not compare two payloads and establish that they describe the same fact. Producers need to use identifiers consistently: a new identifier for the same fill would be a different insert, while a changed payload under an existing identifier would not replace the stored event.

The account's event sequence supplies the order for projection. Folding those events produces each sleeve's cash, positions and lots. A checkpoint can avoid rereading the full history, but it is derived state; the event log remains the input from which the balances are calculated.

## Checking the resulting state

The pure function `check_sleeve_invariants` checks three conditions:

- Cash must not be negative.
- A positive reserved amount must not exceed the cash held.
- A position quantity must not be negative.

The reserved-cash check is separate from negative cash. A sleeve can have $500 in cash and $700 reserved against orders. Its cash is positive, but the commitments exceed it by $200.

The function returns a list of violations with their kinds and values. A caller can then decide how to handle them. The separate `check_account_invariants` function checks whether total cash across sleeves is negative.

The synchronous assertion combines checks for the named sleeves with the account-level check. The fill handler currently calls the affected sleeve's checker. Those paths do not run identical sets of checks, and the fill guard should not be described as a complete account reconciliation.

## Refusing a request before commit

A request to allocate or transfer cash has not yet changed anything at the broker. The fund planners first check the available cash. After appending the planned movements, the service projects the resulting account and calls `assert_write_invariants` for the affected sleeves.

If an invariant fails, the assertion raises `LedgerInvariantError`. The operation does not reach the successful commit in its request handler, and the transaction is rolled back. This second check is useful even when a planner already checked the starting balance: it examines the state produced by the write.

It is still a local transactional check. It should not be read as proof that every concurrent operation across the system is serialized correctly. Transaction isolation and the locking around each operation are separate parts of that responsibility.

## Recording a fill and freezing its sleeve

A fill reports a trade that already occurred. Once the fill can be translated and its postings built, `persist_append` appends it, then calls `_freeze_if_invariant_violated` for an `ORDER_FILLED` event.

The guard projects the account within the same database session, so it can see the newly appended fill. It uses the committed checkpoint plus subsequent events, with `persist=False`, to avoid publishing this uncommitted projection as a shared checkpoint.

If the affected sleeve has no violations, ingestion continues to commit. If it has a violation and is not already frozen, the handler changes its status to `FROZEN` and appends a `SLEEVE_FROZEN` event containing the reason. The fill, status change and freeze event are followed by a commit in the same handler.

![A synchronous request can fail before commit. A recordable broker fill is appended, checked and committed with a freeze if the resulting sleeve violates its invariants.](figure:ledger-write-paths)

In the worked example, the cash projection remains negative $200. Freezing the sleeve does not rewrite the purchase, add money or repair the balance. It records that further activity needs to stop while the discrepancy is reviewed.

The trading risk check reads the sleeve's status and rejects both buys and sells when it is frozen. It also rejects an order if it cannot retrieve the sleeve state. That is a check on subsequent order requests. The freeze handler itself does not cancel every outstanding broker order or reverse a completed trade.

The handler attempts to dispatch an alert after recording the freeze. An alert-dispatch exception is logged and does not undo the freeze. In the current control flow, dispatch is attempted before the final database commit, so alert delivery should not be treated as confirmation that the transaction has committed. That ordering is a concrete point to consider when strengthening incident delivery.

## Handling a repeated fill

The fill translator derives its ledger event ID from the client order ID. The helper takes the first sixteen bytes of the SHA-256 digest and uses them as a UUID. Repeated delivery with the same key therefore reaches the writer with the same event ID.

The freeze event has its own derived key:

```
freeze_key = f"{fill_event_id}:invariant_freeze"
freeze_event_id = deterministic_event_id(freeze_key)
```

The handler also returns without adding another freeze if the sleeve is already frozen. In the tested buy-fill path, redelivery keeps one economic event and one freeze event, rather than applying the cash movement a second time.

![A repeated fill uses the same event ID and does not create a second cash movement. A freeze event records the incident and the sleeve status blocks subsequent order requests.](figure:ledger-repeated-fill)

That identity rule covers a repeated event, not a correction to an existing one. The insert does not update the original payload. A corrected broker fact needs explicit handling rather than relying on redelivery to replace the stored record.

There is also work before the append. For a sell without a supplied cost basis, ingestion resolves FIFO lots before it reaches the writer's duplicate check. The duplicate insert alone therefore does not establish that every replay follows the same path or that all preceding work is harmless. The tests and guarantees need to name the path they cover.

## When the fill cannot be appended

Some fills cannot be represented safely with the available ledger information. For a sell, the ingestion code needs the cost basis of the shares being closed. If the publisher has not supplied it, the portfolio service selects the sleeve's open lots in first-in, first-out order.

If those lots cannot cover the sell quantity, `enrich_sell_fill` raises `FillQuarantineError`. The code does not invent a cost basis to make the postings balance. This happens before the economic event is appended and before the post-fill invariant check.

The stream handler logs the quarantined fill, attempts an alert and raises the consumer's poison-entry error. The quarantine handler attempts to place the raw message on a dead-letter topic for review. Dead-letter publication is best-effort in this implementation; failures are logged. It should not be described as guaranteed durable recovery under every failure.

This is a different outcome from the negative-cash buy example. One fill can be recorded and leaves an invalid projected balance. The other cannot yet be recorded with the information needed to account for it. Both need investigation, but they reach that point through different parts of ingestion.

## How the tests exercise the behavior

The invariant tests construct projected balances directly and check the reported violations. The ledger tests check posting balance, sign consistency, event folding, lot handling and reservation behavior. Fund-service tests exercise the planning and post-write checks.

The fill-to-freeze tests run the actual translator, writer, fold and freeze guard against an in-memory database-session double. One test funds a sleeve with $1,000 and ingests a $24,000 buy. It asserts negative $23,000 cash, a frozen status and one commit. Related cases check the derived freeze ID and repeated delivery.

Those tests exercise application control flow without a real PostgreSQL server, broker or message transport. They do not establish database isolation under concurrent writes, broker cancellation behavior or successful incident delivery during a network failure.

For this review, the four selected portfolio suites passed 92 tests. All 50 cases in the separate trading sleeve-execution suite also passed. That focused run did not meet the trading service’s whole-service coverage threshold, so it is not a full service validation. The smaller $1,200 worked example above was also checked directly against the posting builder and projection.

The resulting design has several responsibilities that can be checked separately: represent the event accurately, derive the balances, detect a state the sleeve cannot use, and block subsequent activity while it is reviewed. Keeping those responsibilities explicit makes it easier to explain both what the ledger records and what still needs operational attention.
