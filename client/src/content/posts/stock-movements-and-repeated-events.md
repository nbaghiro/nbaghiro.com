title: Keeping stock correct when events repeat
date: 2026-11-09
about: Engineering
cover: /img/posts/stock-movements-and-repeated-events-wide.webp
card: /img/posts/stock-movements-and-repeated-events-card.webp
summary: How Clientbridge combines a unique movement key, row locks, and transaction boundaries to handle repeated settlements, concurrent sales, and refunds, with the limits of each mechanism.

A product starts with five bottles in stock. A customer buys two. The payment settles, stock drops to three, and another notification arrives about the same payment. The stock count should stay at three.

In [Clientbridge](https://clientbridge.ca), the inventory code records a signed movement for each sale line. It uses that record to decide whether the line has already affected stock. The current count is stored on the item so the application can read it without summing the movement history each time.

That gives the implementation two values to maintain together: the movement that explains a change and the count that includes it. Repeated delivery, concurrent sales, and refunds each put a different requirement on those writes.

## Give the stock change its own identity

The movement's identity is the pair `line_id, reason`. A sale of two bottles creates a movement with quantity `-2` and reason `sale`. A full refund can create a separate movement for the same line with quantity `+2` and reason `refund`.

This is more specific than the payment notification's identity. Different events can lead the application to recalculate the same order. The stock effect still belongs to the same line. In the tests, a second settlement notification uses a different event ID, and the count remains unchanged.

The database model defines a unique partial index:

```sql
CREATE UNIQUE INDEX ux_inventory_line_reason
ON inventory (line_id, reason)
WHERE line_id IS NOT NULL;
```

The condition matters. Restocks and count corrections do not belong to a sale line. They need to remain separate movements, including two legitimate deliveries of the same quantity on different days. Their retry protection lives at the command boundary, which I will come back to.

A line can therefore have one sale movement and one refund movement under this model. It cannot have two sale movements. This is a domain rule enforced by the database, so every caller that writes through this table has the same constraint.

![A sale notification inserts a movement and changes stock; a repeated notification conflicts with the same movement key and leaves stock unchanged.](figure:stock-repeat-flow)

## Use the insert result to decide whether to change the count

The implementation first locks the item row. It then attempts the movement insert with `ON CONFLICT DO NOTHING`, targeting the partial index, and asks for the inserted ID with `RETURNING`.

Only an insert that returns a new ID changes `stock_on_hand`. A conflicting insert returns no row, so there is no second subtraction. This use of `RETURNING` follows PostgreSQL's rule that it returns successfully inserted or updated rows. [PostgreSQL INSERT documentation](https://www.postgresql.org/docs/current/sql-insert.html).

The essential flow looks like this; this is shortened pseudocode rather than the full service:

```python
item = await lock_item(business_id, item_id)
inserted_id = await insert_movement_if_absent(
    line_id=line_id,
    reason="sale",
    quantity=-2,
)
if inserted_id is not None:
    item.stock_on_hand += -2
```

Checking for a movement and then inserting it would leave a race if two transactions both saw no movement. The unique index settles that race at the write. The application does not have to infer success from a check made earlier.

Both writes use the caller's database transaction. The movement helper flushes changes but does not commit them independently. If the transaction rolls back after inserting the movement, the count change rolls back too. On a retry, the insertion can succeed again because the earlier movement was never committed.

If the transaction commits and the response is lost, the retry finds the movement and leaves the count alone. Those are the two cases the transaction boundary needs to preserve.

This guarantee is local to the database writes. It does not mean the provider sent an event once, or that the whole payment workflow runs once. The handler can run repeatedly while this particular stock effect remains applied once per key.

## A unique key does not prevent lost count updates

Two different customers can buy the same item at the same time. Their line IDs differ, so both movement inserts are valid. The unique index should allow both.

Without coordination around the count, both requests could read five. One subtracts two and writes three; the other subtracts one and writes four. There would be two legitimate movements totaling minus three, but the stored count would be four.

Clientbridge uses `SELECT ... FOR UPDATE` on the item before changing it. The second transaction waits for the first to finish, then works with the locked row. The ORM query also uses `populate_existing=True`, so an object already loaded in the session is refreshed from that query rather than retaining an earlier count.

The application is choosing to serialize changes to a particular item's count. PostgreSQL documents how conflicting row locks wait and remain held until the transaction ends. [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html).

There is a cost to that choice. A popular item becomes a shared point of contention. Holding its lock during slow work makes other purchases wait. It is useful to keep the inventory write section small and inspect the surrounding transaction when latency grows.

When processing multiple items, the inventory queries order them by item ID. A consistent acquisition order reduces one source of deadlocks. It does not prove that all payment and order paths are deadlock-free. The command layer converts detected deadlocks into a `concurrent_change` conflict instead of silently rerunning a mutation without its original guards.

## Reserving stock is a separate question

Applying a completed sale once does not tell the shop whether it can accept a new checkout. Two customers might reach checkout while the last bottle is still waiting for payment.

The stock check locks the order or invoice and the relevant item rows. It gathers quantities from lines that have no sale movement yet. It then subtracts stock held by other documents with payment rows in the selected active states.

For an online order, the requested quantity must fit within that available amount. With one unit on hand, a pending checkout can hold that unit even though no sale movement has reduced the physical count yet.

![One unit on hand is held by the first pending checkout; the second checkout sees zero available after the first transaction commits.](figure:stock-reservation-flow)

The test for this uses two separate database sessions. The first locks and checks the item, pauses briefly, creates a pending payment, and commits. The second attempts checkout while the first is still running. After it can acquire the item lock, it sees the hold and receives `out_of_stock`.

There is a deliberately conservative detail in the current query: `failed` payments count as holds alongside `pending` and `succeeded` payments, while lines already represented by sale movements are excluded. A canceled payment releases its hold. That makes the payment lifecycle part of inventory availability. A failed attempt cannot simply be forgotten if its row continues to reserve stock.

The policy also differs by channel. Online orders enforce the stock limit. A staff sale can go below zero when there are no competing holds; an existing test explicitly allows selling three units when one is recorded on hand. That can support a business whose recorded count is behind its physical shelf, but it means a negative number is a valid operational state to explain and correct.

## Refund money and returned goods need an explicit policy

The current synchronization function handles two document states: `paid` and `refunded`. It derives those states through the payment ledger before applying stock movements.

For a paid document, each tracked product line gets its sale movement. For a fully refunded document, a line gets a refund movement only if a sale movement already exists. A partial monetary refund leaves the stock out.

With the five-bottle example, the sequence is five, three, three after a repeated settlement, then five after a full refund. The test checks both the count and that the history contains exactly the sale and refund movements.

This is a simple policy, with a clear limitation: a full refund does not necessarily mean a sellable product came back. A refund for damaged goods may need a separate count correction. A more detailed returns system would record the quantity received, its condition, and whether it can go back into available stock.

The current key also supports only one sale and one refund effect per line. It is not a model for several partial returns or repeated cycles of returning and selling the same line. Those workflows would need a return or fulfillment identity with quantities of its own. Reusing this key would suppress legitimate later changes.

Quantity handling is another boundary. The service rounds line quantities to whole units using decimal half-up rounding and skips nonpositive quantities. That fits countable products. It would need a different representation for products sold by weight or length, where rounding to a bottle-sized unit would discard information.

## Restock retries use the command boundary

A restock has no sale line, so the partial unique index cannot identify its retry. The restock endpoint accepts an idempotency key and passes the request through the shared command layer.

That layer scopes the key to the business and action, takes a transaction-scoped advisory lock for the key, and checks for a stored response. It hashes the request body so reusing a key with a different quantity is rejected. On the first execution, the mutation, audit record, and saved response are committed together.

The restock test starts at two units, adds six, then repeats the request with the same key. Both responses represent the completed command and the stored count remains eight.

The key is optional at the service boundary. Without it, two restock requests are two separate changes. A caller that wants safe retries has to preserve and resend the same key for the same operation. A new key means a new operation.

## What the tests establish, and what I would add

The existing tests cover repeated settlement, full and partial refunds, restock retries, stock corrections, and two connections competing for the last online unit. They also document policies that might otherwise be surprising, including negative stock for a staff sale.

I would add direct fault-injection tests around the movement and count writes: fail after the insert but before the count flush, roll back, then retry. I would also race two different paid lines for the same item and verify that both movement quantities are reflected in the final count.

For reconciliation, a useful check would compare the current count with an explicit opening balance plus subsequent movements. That requires knowing where the history starts; a directly seeded starting count cannot be reconstructed from later movements alone. I would treat reconciliation as an additional check to build, not an existing guarantee of this service.

The useful property of this design is that each mechanism has a small job. The movement key identifies an effect that has already happened. The item lock coordinates different effects on the same count. The transaction keeps the explanation and the count together. Availability and returns remain product rules that have to be defined around those mechanisms.
