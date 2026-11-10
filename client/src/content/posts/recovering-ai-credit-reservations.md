title: Recovering AI credit reservations after a crash
date: 2026-11-10
about: Engineering
cover: /img/posts/recovering-ai-credit-reservations-wide.webp
card: /img/posts/recovering-ai-credit-reservations-card.webp
summary: How Galleo reserves credits before AI work, checkpoints measured usage, and closes abandoned operations, including the uncertainty that remains after a process stops reporting.

An AI operation can stop after it has already used tokens or produced an asset. If the server disappears before updating the balance, the application still has to decide what happened to the credits it reserved.

In [Galleo](https://galleo.app), I separate the initial reservation from the final charge. A durable operation records the estimate, a lease, and the latest saved usage checkpoint. Normal completion settles from the run's meter. Recovery settles from the last checkpoint and records that it recovered an interrupted operation.

That distinction is useful because a reservation, a measurement, and a provider's eventual bill can describe different amounts. The implementation needs a policy for the gaps between them.

## Reserve before starting provider work

Suppose a workspace has 100 credits and an operation is estimated to cost 30. The reservation reduces the available balance to 70 before the provider work begins.

The reservation transaction locks the workspace row with `FOR UPDATE`, reads the current balance, and rejects an estimate it cannot cover. If accepted, it writes three things together: the operation, a negative journal posting for the reserve, and an activity row for the user to see.

The row lock matters when several workspace members start work at once. Without it, two requests could both check the same balance before either subtraction was visible. PostgreSQL holds conflicting row locks until the transaction ends, allowing the application to serialize these balance changes. [PostgreSQL row locking](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS)

The provider request runs after that transaction. The application does not keep the balance row locked throughout generation. A slow model call should not prevent every other balance change for that workspace.

The estimate is an admission check, not a promise about the eventual cost. A longer response or a different set of generated assets can cost more. This code does not enforce a continuous spending ceiling at every token. It decides how to settle the difference afterward.

## Keep the operation, journal, and activity separate

The operation records the work's lifecycle. Its status starts as `held`, then becomes `settled` or `recovered`. Alongside the estimate, it stores the lease expiry and checkpointed dollar amount. Once closed, it records what was owed, what was actually debited, and what the product absorbed.

The journal records balance movements. A reserve is one posting; a later adjustment from the estimate is another. Each posting carries a workspace sequence number and balance after the movement. The workspace keeps a current balance for efficient reads.

The activity row presents one action to the user. It initially shows the estimate and is updated to the final debit. If the operation costs nothing, that activity row is removed, while the journal still preserves the reserve and its reversal.

These records answer different questions. The activity explains what a person did. The operation explains how it was settled. The journal makes it possible to check the balance against an opening amount plus subsequent movements.

That separation avoids changing the historical journal just to make the activity list easier to read. An operator correction is another posting with its own idempotency key and explanation.

## Measure the work that the application can observe

The spend wrapper opens a meter around the operation. Model calls report token usage into that context; asset-producing code reports completed units. The dollar calculation combines token usage, priced assets, and additional amounts recorded at the call site.

The token calculation distinguishes fresh input, cached input, and output. It uses the model's configured rates. The asset calculation uses the unit prices selected for the action. The resulting dollar sum is converted to credits once, so several small components do not each receive a separate minimum charge.

In the current internal conversion, one credit represents $0.0025 of calculated usage. Positive usage rounds to credits with a minimum of one; a run with no recorded usage owes zero. Those are application rules, not a statement of any provider's current price.

There are important measurement limits. A provider can consume resources before its usage result reaches the application. The meter only contains what the application recorded. Unknown models are skipped by the pricing function, and an asset without a configured unit price contributes zero. Those choices prevent guessed charges, but make catalog coverage and missing-price checks necessary.

I would therefore describe the result as usage priced from application observations. Comparing it with provider billing is a separate reconciliation task. Calling it the exact provider invoice amount would overstate what this meter knows.

## Settle the difference from the reservation

Normal completion runs settlement from a `finally` block. The same path runs when the operation throws or is aborted, provided the process remains alive long enough to execute it.

With 30 credits reserved and 8 credits of recorded usage, settlement returns 22 credits. The balance goes from 70 to 92, giving a net charge of 8.

![A 100-credit balance falls to 70 when 30 are reserved, then rises to 92 when the operation settles for 8. The journal keeps both movements.](figure:credit-reserve-settle)

The opposite case needs a policy too. Imagine a workspace starts with 35 credits, reserves 30, and ultimately owes 45. Only 5 remain available. This implementation takes those 5, records a total debit of 35, and records the remaining 10 as absorbed. It does not drive the balance negative.

Settlement reads the current balance under a lock. It cannot calculate that extra debit from the balance that existed when the run started, because other operations may have changed it meanwhile.

The operation row is also locked and checked. Only a `held` operation can close. The settlement posting uses a unique key derived from the operation ID. A second settlement sees a closed operation and makes no further balance change.

This protects settlement of one operation. It does not make a repeated HTTP request automatically reuse its original reservation. The reserve function creates a new operation; request-level deduplication must be handled at the appropriate caller if the same user action can be submitted again.

## Save a checkpoint while the process is alive

A process crash does not run `finally`. The recovery path needs information that survived outside the process.

The spend wrapper sends a heartbeat every 30 seconds. Each heartbeat extends the operation's lease three minutes into the future and saves the dollar amount currently known to the meter. The update applies only while the operation remains `held`.

In the example above, a saved checkpoint of $0.02 represents 8 credits under the internal conversion. If the process dies after that checkpoint, recovery can close the 30-credit hold at 8 and return 22.

If no usage has been checkpointed, the saved amount is zero. Recovery returns the whole reservation. This deliberately favors returning an unsupported charge rather than assuming the estimate was spent.

The checkpoint interval trades database traffic against how much observed work can be lost. A shorter interval saves progress more frequently. It cannot solve usage that the provider has consumed but not yet reported. Even a heartbeat immediately before a crash can be incomplete in that sense.

## Claim abandoned operations in a short transaction

The housekeeping loop runs at startup and once per minute. A recovery pass selects up to 50 `held` operations whose leases have expired, ordered by expiry time.

It uses `FOR UPDATE SKIP LOCKED`, allowing another recovery instance to skip rows already claimed by a transaction. PostgreSQL describes this option as useful for queue-like work, while warning that it does not provide a consistent view for general queries. [PostgreSQL SELECT locking clauses](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)

The claim transaction extends those leases and returns the saved checkpoint amounts. It then commits. Each operation is settled separately through the regular settlement function, using status `recovered`.

![A live operation renews its lease and saves usage. After heartbeats stop and the lease expires, recovery claims it and settles the last saved amount without rerunning provider work.](figure:credit-recovery-flow)

The extended lease prevents another pass from immediately claiming the same work after the row locks are released. If the recovery process itself dies before closing an operation, that lease can expire again and another pass can retry.

Recovery does not restart generation or repeat provider calls. It closes the credit reservation from saved evidence. Recovering the generated document or asset is a different workflow and needs its own durable state.

The batch size and minute tick also affect delay. Expiry makes an operation eligible for recovery; it does not mean it will close at that exact instant, particularly if there is a backlog or the database is unavailable.

## An expired lease is not proof that the worker died

A paused event loop or database outage can prevent heartbeats while provider work continues. The heartbeat callback currently catches write failures and continues running. That keeps one failed checkpoint from immediately aborting generation, but it also allows the lease to expire on a live operation.

If recovery closes the operation first, a later normal settlement does nothing because the status is no longer `held`. That avoids charging twice. It also means the later, more complete measurement does not automatically replace the recovered amount.

The claim and settlement are separate transactions. Recovery captures a checkpoint when it claims the row; a newer heartbeat or a normal settlement can race with the subsequent close. The status check determines whether settlement can proceed. It does not turn the earlier checkpoint into a final measurement.

For stronger control, I would add an ownership generation that a live worker must still hold before making further paid calls, plus explicit handling for failed heartbeats. Checkpoints would also benefit from a monotonic sequence so a delayed older write cannot overwrite newer progress. These are improvements to the current protocol, not guarantees it already provides.

The `recovered` status preserves the distinction for review. If later provider evidence establishes a different amount, an operator can append a correction rather than silently edit the journal. The product needs a clear policy for when such corrections are appropriate.

## Drain on shutdown, then rely on recovery

On an orderly shutdown, the server stops accepting new connections and gives active metered work a 20-second budget to finish. Operations that complete can settle from their final meter. Anything left behind remains recoverable from its saved checkpoint.

That reduces the number of interrupted holds during normal deployments. It cannot replace recovery: a killed process, host failure, or exhausted shutdown budget can still leave work open.

The tests cover refusing an unaffordable reserve, refunding the unused portion, limiting an additional debit, and preserving journal balance. Recovery tests cover a zero checkpoint, a nonzero checkpoint, a live lease left alone, and a late settlement arriving after recovery already closed the operation.

I would extend those tests with two concurrent recovery instances, a delayed heartbeat, failed checkpoint writes while a provider call continues, and a crash after claiming but before settling. Those interleavings exercise the uncertainty that ordinary success tests cannot show.

The resulting behavior is explainable to both the user and the operator: an estimate temporarily reduces availability, measured usage determines normal settlement, and interrupted work closes from the latest saved evidence. The remaining uncertainty is recorded instead of being hidden inside the final balance.
