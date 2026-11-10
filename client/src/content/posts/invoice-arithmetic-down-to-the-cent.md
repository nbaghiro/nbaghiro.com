title: Keeping invoice arithmetic consistent down to the cent
date: 2026-11-09
about: Engineering
cover: /img/posts/invoice-arithmetic-down-to-the-cent-wide.webp
card: /img/posts/invoice-arithmetic-down-to-the-cent-card.webp
summary: Exact rates, per-line rounding, discount allocation, and the point when an invoice's numbers become fixed, with examples from Clientbridge's backend.

An invoice needs to agree with several other records. Its lines must add up to its total. The payment page must show the amount the business issued. The receipt and ledger must still agree after the business changes a setting.

In [Clientbridge](https://clientbridge.ca), those requirements reach beyond the function that multiplies a price by a tax rate. They affect discount allocation, document states, and what happens when payment and repricing run at the same time.

This is how the backend handles those boundaries today. The rates below are inputs to arithmetic examples and test fixtures. The useful part is the calculation and the lifecycle around it, rather than a guide to which tax a particular business should charge.

## Store the amount and the rate at their own precision

The backend stores monetary amounts as integer cents. A line worth $9.99 carries `999`, and a tax amount of $1.20 carries `120`. That keeps addition and equality checks exact within the application's cent-based currency model.

Rates need their own representation. A rate of 9.975% cannot be represented exactly in whole basis points. The rate table uses `Decimal("0.09975")`. The tax engine converts that decimal to a `Fraction` before multiplying or dividing, so the intermediate calculation remains exact too.

For a base of 100,000 cents, that rate produces 9,975 cents. If the engine first rounded the rate to 998 basis points, the result would be 9,980 cents. The five-cent difference comes from rounding the rate before using it, even though both calculations used integer money.

Clientbridge does expose rounded basis points in some response fields. The important boundary is that the tax calculation uses the original decimal rate. A client that takes the rounded response field and calculates the amount again could disagree with the server. The response already carries the calculated cents, which are the amounts to display.

This design also has a scope: it assumes the monetary unit is a cent. Supporting currencies with a different minor unit would require changing that assumption explicitly across the model, calculation, and presentation code.

## Decide where rounding happens

Clientbridge calculates each applicable tax component on each line, rounds it to cents, and then adds the results. Rounding the final invoice total instead is a different policy.

Consider two five-cent lines and one illustrative 10% component. Each line produces half a cent of tax. With the engine's rounding rule, each becomes one cent, so the invoice collects two cents. Combining the lines first gives a ten-cent base, whose tax is one cent.

Both calculations are easy to write. Only one can describe the document consistently. The backend chooses the per-line result, and its invoice total is the sum of those rounded line amounts. A receipt renderer must preserve that choice instead of independently applying a rate to the subtotal.

![Rounding each line gives two cents; rounding the combined base gives one cent. The engine follows the line calculation.](figure:invoice-rounding-boundary)

The rounding helper works on a rational number:

```python
whole = floor(abs(value) + Fraction(1, 2))
return whole if value >= 0 else -whole
```

A positive half-cent becomes one cent. A negative half-cent becomes negative one cent. This is an explicit tie rule, rather than an accidental consequence of a language's default rounding function. The helper's treatment of negative values does not, by itself, define the whole refund process; that still needs its own document and accounting rules.

With the two components used in the backend's $9.99 test, 5% produces 49.95 cents and 7% produces 69.93 cents. The stored results are 50 and 70 cents. The line tax is 120 cents, and the final amount is 1,119 cents.

## Allocate a discount before calculating tax

A document-level discount needs to become line-level amounts when lines have different tax treatment. Clientbridge applies each line's own discount first, then divides the document discount across the included lines by their remaining value. Tax runs over the resulting line amounts.

The allocation helper uses integer division followed by largest remainders. It calculates each line's whole-cent share, ranks the fractional remainders, and distributes the cents left over. Ties use the input order, so the result is deterministic for the same ordered lines.

For a one-cent discount across three equal $1.00 lines, the first pass assigns zero cents to every line. One cent remains. The tie rule gives it to the first line, leaving taxable bases of 99, 100, and 100 cents. The discount still totals exactly one cent.

Rounding three independent shares would lose that cent. Giving the same cent to every line would turn it into a three-cent discount. The allocation function makes the conservation rule part of the implementation: the shares must add back to the original discount.

This has an observable consequence. Reordering equal-weight lines can move the spare cent to a different line. If those lines have different tax classes, the line-level tax calculation can be affected. Stable ordering and an explicit allocation policy matter even when every stored amount is an integer.

Fractional quantities have a rounding point too. The backend multiplies a decimal representation of quantity by the unit amount, rounds the gross line value to cents, and then applies discounts. Keeping that sequence clear makes it possible to explain an invoice from its inputs.

## Inclusive prices need a different calculation

For a price that already includes tax, the engine divides by one plus the sum of the applicable rates. It calculates each component from that unrounded base, rounds the components, and subtracts their sum from the original gross amount.

With a gross amount of 11,200 cents and illustrative rates of 5% and 7%, the divisor is 1.12. The components become 500 and 700 cents. Subtracting their 1,200-cent sum leaves a 10,000-cent base, preserving the original 11,200-cent total.

The choice of applicable components happens before that division. An exempt line has none. A `federal_only` line filters the components by code. Using the combined rate from the whole business for every line would be wrong for an invoice with mixed classes.

There is a useful implementation limit here: the engine adds the applicable rates against a common base. It does not model arbitrary compound taxes where one component applies to another component. A new tax system with different calculation rules would need more than another entry in the rate table.

## Fix the amount at a document boundary

A draft is allowed to follow current settings. An issued invoice needs to retain the amounts it charged.

When Clientbridge issues an invoice, it assigns the number and issue time, calculates and stores each line's tax, updates the document totals, and passes that calculation to the ledger posting. These operations run through the database-backed issuance flow.

Later reads use `issued_tax`, which takes each line's stored `tax_amount_cents`. It does not decide whether to charge tax again from the business's current registration setting.

One integration test creates a $24.00 line with $2.88 tax and a $26.88 total. It then changes the business's registration setting. The public payment page still shows $1.20 and $1.68 as the two components, and the same $26.88 total. Another test checks that settlement and the receipt preserve those charged amounts too.

![Drafts can follow changed settings. Issued invoices retain their stored line tax for the payment page, receipt, and ledger.](figure:invoice-issue-boundary)

An estimate has a different boundary. A sent, unaccepted estimate can still be repriced while it remains open. Accepted estimates retain their totals. An open sales ticket can be repriced only while it has no pending or successful payment and no applied gift-card amount. The state of the document determines whether recalculation is allowed.

Those rules mean that “use the latest settings” cannot be a universal helper applied to every billing read. It has to be a decision made with the document's state.

## Preserve fixed totals when reconstructing the breakdown

The current storage model keeps each line's total tax, rather than a complete immutable snapshot of every jurisdiction component. To show the breakdown later, `split_fixed` uses the rates for the relevant historical date.

If the normal calculation matches the stored total, the engine uses that breakdown. If it does not, the engine divides the fixed total in proportion to the rates, rounds those shares, and assigns any remaining difference to the last component.

A test supplies a fixed tax of 1,300 cents with component weights of 5 and 7. The proportional shares become 542 and 758 cents. Their sum remains 1,300. This is a reconstruction rule for a stored amount; it does not pretend that 1,300 was the original result of applying 12% to a 10,000-cent base.

The benefit is that a later display can preserve the charged total. The tradeoff is that reconstruction still depends on historical rate data and context. The application restricts province changes after documents have charged tax, but that is not equivalent to storing every original input. A stronger historical record would persist the jurisdiction amounts, exact rates, date context, and calculation version at issue time. That would make later rate-table corrections less dependent on reconstruction.

## Recheck after waiting for a lock

The lifecycle boundary also needs to hold under concurrency. A repricing job can select an open ticket just as a payment begins.

Clientbridge's repricing path locks candidate document rows with `FOR UPDATE`, refreshes their ORM values, and then performs another query to check that they still meet the eligibility conditions. A pending payment committed while the job waited must cause the ticket to be excluded.

The test for this interleaving has one session lock an order and add a pending payment. A second session starts repricing and waits. After the first session commits, repricing leaves the amount alone.

The extra read is important because the eligibility check includes related payment records. Locking the ticket does not make an earlier view of those records current. The guarantee also depends on payment paths participating in the same locking convention. A new writer that bypasses it could reopen the race.

## Test the calculation and the documents that use it

The pure engine tests cover precise rates, small amounts, inclusive prices, registration switches, and mixed tax classes. They make numerical mistakes easy to isolate.

The integration tests cover a different set of failures: a payment page changing after issue, a receipt disagreeing with settlement, a draft failing to follow new settings, or repricing overwriting an amount while payment starts. Historical rate selection uses the business's local calendar date, so a UTC timestamp near midnight also has a dedicated test.

These tests are useful together. A correct multiplication function cannot protect a receipt that recomputes from current settings. A well-controlled document lifecycle cannot repair a rate that lost precision before calculation.

For this code, the most useful invariants are straightforward: allocated cents must add up, invoice totals must equal their stored lines, and later views of an issued document must preserve what was charged. Each one has a specific place in the implementation and a failure case the tests can reproduce.
