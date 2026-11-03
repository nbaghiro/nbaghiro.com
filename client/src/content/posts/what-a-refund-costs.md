title: What a refund costs the business
date: 2026-09-16
updated: 2026-11-03
about: Payments
category: Industry & practice
cover: /img/posts/what-a-refund-costs-wide.webp
card: /img/posts/what-a-refund-costs-card.webp
summary: The cost of a refund includes what happens to the original processing fee. A practical way to compare providers using completed sales and cancellations.

A full refund can return the purchase price to the customer while leaving a payment-processing expense with the business. That expense is easy to miss when comparing providers using only the cost of a completed sale.

Stripe's [refund-fee explanation](https://support.stripe.com/questions/understanding-fees-for-refunded-payments) says that the original processing fees are not returned. Whether issuing the refund introduces an additional fee depends on the pricing arrangement and payment method. Those are separate questions: what happens to the original fee, and whether another fee applies.

## Following a small example

Suppose a business takes 100 payments of $100 each. To keep the arithmetic simple, assume a hypothetical processing fee of $3 per payment, with no additional refund fee. This is an illustration, not a quote from a provider.

The business collects $10,000 and pays $300 in processing fees. Ten customers then receive full refunds, returning $1,000. The business has retained $9,000 of customer payments, while the original $300 of fees remains.

On the original payment volume, that fee was 3%. Relative to the amount retained after refunds, it is about 3.33%. Nothing about the quoted rate changed. The difference comes from paying to process transactions whose purchase amounts were later returned.

Looking only at the 90 sales that remained would leave out the fees on the ten refunded payments. That would understate the payment expense for this group of transactions.

## Keeping the amounts distinct

The example contains three different amounts:

- **$1,000 returned principal:** the purchase amounts sent back to customers.
- **$300 total processing expense:** fees on all 100 original payments.
- **$30 fees attributable to refunded payments:** ten payments at the hypothetical $3 fee.

Calling all $1,300 the cost of refunds would combine returned revenue with processing expense. Calling $300 the fees caused by the ten refunds would include the $270 paid on retained sales.

The remaining amount is not a profit calculation either. It says nothing about the cost of providing the service, delivering goods, handling support or running the business. The example is deliberately limited to the payment movements and fees.

Partial refunds need the same care. A payment can remain a sale while some of its value is returned. Counting only fully canceled orders would miss those adjustments. A useful review follows the original payment and its associated refunds, instead of assuming every order belongs cleanly in one of two groups.

## Comparing a realistic month

A provider comparison becomes more useful when it uses a representative mix of transactions. Alongside payment amounts and methods, I would include how often refunds occur and how much is usually returned. If cancellations vary by season, one unusually quiet month may be a poor basis for the comparison.

The provider's current terms then determine which fees remain, which are returned and whether issuing a refund adds another charge. A percentage shown on a pricing page cannot answer all of that on its own. Fixed fees, subscriptions and differences between payment methods can also affect the total.

For a first comparison, the aim can stay modest: apply each arrangement to the same set of hypothetical payments and refunds. Keeping the transaction mix fixed makes it easier to see which differences come from pricing and which come from assumptions about the business.

## What the records have to hold

Store provider identifiers so a payment and its refunds can be linked to reported fees. Missing local fee details can sometimes be retrieved through provider APIs; without identifiers, reconciliation may require more expensive statement matching.

For each payment I would keep the gross amount, the fee as the provider reported it, the net
received and the identifier the provider used. A refund needs the payment it belongs to, its
amount and its own fee treatment. That link is what lets a later review follow a refund back
to the sale it reverses instead of counting the two as unrelated events.

Currency adds another layer. A payment taken in one currency and settled in another can carry
a conversion spread that does not appear as a line item. If the business sells across borders,
the settled amount is the one to reconcile against, not the amount shown at checkout.

## Pricing shapes behave differently

A flat-rate arrangement may use a blended percentage plus a fixed fee across several card types. Interchange-plus exposes interchange separately from the processor's markup. Those are useful distinctions, but “flat-rate” and “blended” are not mutually exclusive categories. Refund treatment must still be read for the actual agreement.

A card mix matters here as well. Premium consumer cards and commercial cards often carry higher
interchange than standard debit. A business whose customers mostly tap a debit card has a
different cost profile from one taking corporate cards, even at identical volume.

Use the same transaction mix for each comparison, including payment method, currency and refunds.

## Reconciling what actually happened

Afterward, the provider's records should be used to check the calculation. I would want to trace each refund to its payment, see the fee treatment and distinguish completed refunds from requests still being processed.

Timing matters to that review. A payment collected in one period may be refunded in another. Comparing a month's refunds with only that month's new sales can mix different groups of transactions. Reviewing a group of payments together with their later refunds answers a different question from reviewing cash movements during a calendar month; both views can be useful if they are labeled clearly.

Cancellation and refund are also different operations. [Stripe distinguishes cancelling an incomplete payment from refunding a successful one](https://docs.stripe.com/refunds). Where cancellation is still available, its fee treatment can differ from a refund after processing. The comparison should use the operation the business would actually perform.
