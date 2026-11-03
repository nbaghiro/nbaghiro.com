title: Running Clientbridge as a Stripe Connect platform
date: 2026-10-29
updated: 2026-11-03
about: Clientbridge
cover: /img/posts/running-clientbridge-on-stripe-connect-wide.webp
card: /img/posts/running-clientbridge-on-stripe-connect-card.webp
summary: How Clientbridge uses Stripe Connect: an Accounts v2 account per business, direct charges with an application fee, Stripe holding verification and losses, and the event and ledger work that stays with the platform.

Clientbridge takes payments for service businesses: a deposit when a client books, an invoice paid by card from a link, a membership that renews every month. The money belongs to the business. It should land in the business's bank account, appear under the business's name on the client's statement, and be refunded or disputed against the business's balance. Clientbridge takes a small fee on each payment and charges the business for its plan.

Stripe calls this arrangement a platform, and Stripe Connect is its product for platforms. This article explains how Clientbridge is set up on Connect, which parts Stripe takes on, and which parts still need careful work on our side.

## The platform account and the connected accounts

Clientbridge has one Stripe account of its own, the platform account. Every business that turns on payments gets a separate Stripe account connected to it. The platform's API key can act on any of those accounts by naming it, so one integration serves every business without holding anyone else's credentials.

Clientbridge creates those accounts through the Accounts v2 API. In v2 an account is one identity that can carry more than one configuration. Clientbridge uses two:

- **merchant**, for a business that takes payments from its clients. It requests the `card_payments` and `link_payments` capabilities and sets the statement descriptor from the business's name.
- **customer**, for a business that pays Clientbridge for its plan. It requests `automatic_indirect_tax`, so Stripe Tax can place the business by its address and charge the right sales tax on the plan.

The same account is both. The business that collects a client's deposit is the same legal entity that pays the monthly plan, so the configurations can share identity information already supplied. Stripe can still request updated or additional information later.

![A client pays into the business's own Stripe account, which pays out to the business's bank. The merchant configuration sends Clientbridge its application fee, and the customer configuration pays the plan.](figure:connect-accounts)

## Deciding who is responsible for what

The most important choices are made when the account is created, because Stripe fixes them at that point:

```python
defaults = {
    "currency": "cad",
    "locales": ["en-CA"],
    "responsibilities": {
        "fees_collector": "stripe",
        "losses_collector": "stripe",
    },
}
params = {
    "display_name": business_name,
    "dashboard": "none",
    "identity": {"country": "ca"},
    "configuration": {"merchant": {...}},
    "defaults": defaults,
}
account = await client.v2.core.accounts.create_async(params, {"idempotency_key": key})
```

Each of these fields assigns a piece of work to either Stripe or the platform.

`fees_collector: stripe` means Stripe takes its own processing fee directly from the business's account on each charge. Clientbridge does not collect Stripe's fee and pass it on.

`losses_collector: stripe` means Stripe is liable for the business's negative balances. A balance goes negative when more leaves the account than is in it: a refund larger than the available funds, or a chargeback after the money has been paid out. With this setting, that shortfall is between Stripe and the business. Clientbridge remains liable for negative balances on its own platform account, but not for those of the businesses it serves.

`dashboard: none` means Clientbridge does not give the business a separate Stripe Dashboard. It provides onboarding and payment-management screens through embedded components, which can still require Stripe authentication.

These choices also affect who collects verification requirements. [Stripe's configuration documentation](https://docs.stripe.com/connect/accounts-v2/connected-account-configuration) describes how loss responsibility and dashboard access determine that assignment. In this configuration Stripe collects and reviews the requirements; Clientbridge presents their status and the embedded flow for supplying information.

![What Stripe handles and what Clientbridge handles, once the account's responsibilities are set.](figure:who-handles-what)

The responsibility settings let Clientbridge use Stripe's verification and connected-account risk processes. They do not remove Clientbridge's responsibility for its own platform balance, application behavior or obligations under its agreements.

The tradeoff is control. Stripe decides when an account needs more information and whether it can accept payments. Clientbridge can show the business what Stripe needs and link it to the place to provide it, but it cannot override Stripe's decision.

## Onboarding inside the product

Because the business has no Stripe dashboard, Clientbridge provides those screens with Connect embedded components. The server creates an account session for a single component, and the browser renders it using the session's client secret. Clientbridge uses five:

- **account onboarding**, where Stripe collects whatever is still required
- **account management**, for the details already on file
- **notification banner**, which shows when Stripe needs something
- **payments**, with dispute management turned on and refunds and capture turned off, because refunds go through Clientbridge so its own records stay correct
- **payouts**, where the business can change its payout schedule; instant payouts are off

Each session keeps `disable_stripe_user_authentication` set to false. Stripe collects the requirements, so it continues to authenticate the person entering them.

Clientbridge learns about changes to an account from three v2 events: `requirements.updated`, `capability_status_updated` on the merchant configuration, and `account.closed`. Requirements updates include the minimum deadline, and the `card_payments` capability status decides whether the business can take card payments. A capability that is pending with no resolution needed is treated as Stripe's own review rather than a block on the business.

## Taking a payment

Clientbridge uses direct charges. A PaymentIntent is created on the business's account, not on the platform account, and carries an application fee:

```python
intent = await stripe.PaymentIntent.create_async(
    amount=amount_cents,
    currency="cad",
    application_fee_amount=fee_cents,
    customer=customer_id,
    stripe_account=account_id,
    idempotency_key=key,
)
```

With a direct charge, the payment belongs to the business. It settles into the business's balance, appears under the business's statement descriptor, and the client and saved payment method are stored on the business's account. Stripe takes its fee from that account, and the application fee moves to the platform.

The same pattern covers each way a client can pay:

- **A card at checkout.** The intent returns a client secret, and the browser confirms it.
- **A saved card, charged later.** The intent is created with the saved payment method, `confirm=True` and `off_session=True`. If the bank asks for authentication, the request fails cleanly, and Clientbridge asks the client to confirm the payment.
- **A Canadian pre-authorized debit.** The intent is limited to `acss_debit` and refers to a mandate the client has already accepted.
- **A membership.** It is a Stripe subscription on the business's account, using a price created on that account, with `application_fee_percent` instead of a fixed amount.

Creation requests use an idempotency key tied to the intended operation. Recovery must retain that identity and its parameters, then observe the provider's retention and retry rules. For [Stripe API v1](https://docs.stripe.com/api/idempotent_requests), a saved response is reused while the key is retained, including some error responses. A stable key does not make an indefinitely delayed retry safe without checking the existing operation.

### Sizing the fee

Clientbridge calculates its fee using configured estimates of Stripe's percentage for the method. It caps its own share and the modeled combined percentage:

```python
room = ceiling_bps - stripe_bps        # stripe_bps depends on the method
fee = amount * max(0, min(room, max_bps)) // 10000
```

With those configured rates, a card leaves less room for Clientbridge's share than a pre-authorized debit. A configured conversion surcharge can use all the remaining room, reducing the application fee to zero. Fixed fees sit outside this percentage calculation.

This is a pricing rule, not a measurement of each transaction's eventual effective cost. The final balance transaction can include fee details that differ from the estimate. Those reported amounts belong in reconciliation; the formula should not be advertised as an unconditional cap on every processing charge.

![Three charges drawn against the ceiling: a card, a pre-authorized debit and a card in another currency. Schematic, not to scale.](figure:fee-ceiling)

## Refunds and disputes

A refund is created on the business's account against the original PaymentIntent. Clientbridge decides whether the application fee is returned. Ordinarily it is not. When Clientbridge voids something itself, for example an order whose payment arrived after the order expired, it refunds the full amount and returns its fee.

Stripe and the card networks handle the dispute process. The business responds through the embedded payments component. When a dispute opens, Clientbridge reads the dispute's balance transactions and records the withdrawn amount and the dispute fee against the business's books. It records nothing for an inquiry or for a dispute that the card network prevented, because no money moved. It then tracks the case's status so the app can show it.

## Events, and the work that stays with the platform

Stripe moves the money, but Clientbridge keeps its own records: invoices, receipts, membership status and a double-entry ledger. Those records have to stay consistent with Stripe, and webhooks are what keep them up to date.

Clientbridge receives three event streams:

- connected account events: payments, refunds, disputes, payouts, mandates and invoices
- thin v2 events about the accounts themselves
- platform account events for its own plan subscriptions

The first and third are snapshot events, carrying an object representation associated with the event and its API version. Thin v2 notifications identify the affected object; the handler retrieves its state when processing the notification. That read can be newer than the event, but it can also change again afterward. It still needs the appropriate API contract and concurrency handling.

Each event is processed in the same order:

1. **Verify** the signature.
2. **Check the API version.** Payloads are parsed against one pinned Stripe API version. An event rendered at another version is rejected, and its payload is kept so the event is not lost.
3. **Deduplicate.** The event id is the primary key of the webhooks table, and the row is locked while it is processed. A second delivery of a processed event does nothing. If two deliveries race, the one that loses on the key steps aside.
4. **Apply in one transaction.** The local business changes and queued notification record commit together. Sending that notification is later work; a committed queue record is not proof of delivery.
5. **Keep failures.** An event that raises is stored with its payload in a failed row, so it remains visible after Stripe stops retrying.

![The five steps every Stripe event passes through, and the replay job that feeds missed events back into the same path.](figure:event-pipeline)

For most event types, the handler only queues a client notice while the event is recent. Events older than a day still update records without generating the usual notice. Issued gift cards are an exception because their recipients still need the card.

Stripe retries deliveries, but an event can still be missed. A scheduled job looks for undelivered events from the past seven days, re-reads each affected object from Stripe and applies the event that the object's current state represents. If a payment has been refunded since the missed event, the replay applies the refund rather than the earlier state. Account events cannot be listed as undelivered, so the job re-reads the account itself. Each run is capped at 100 events per account and 500 in total, so one account with a long backlog cannot hold up the others.

## The ledger

Every amount that moves is recorded in a double-entry ledger. When a charge's fees are known, one entry records both sides:

- **The business's side.** A processing fee and a platform fee are recorded against its Stripe balance.
- **The platform's side.** The same application fee is recorded on its Stripe balance and as fee revenue.

Refunds, disputes and payouts are recorded the same way from their events. Payouts are only accepted in Canadian dollars. A payout in any other currency is refused and logged rather than recorded at an assumed rate.

Because each entry comes from the event that caused it, the business's books in Clientbridge can be checked against Stripe's balance transactions, and Stripe remains the authority on what actually moved.

## What remains with Clientbridge

For this configuration, Stripe provides the payment infrastructure, verification process and assigned connected-account loss handling. Clientbridge decides when to request a charge, calculates the amount and sales tax, presents the invoice and receipt, and reconciles its records with Stripe.

The boundary needs to remain visible during failures. An accepted payment can still need a local invoice update; a committed notification can still need delivery; a missed event can still need replay. The integration is complete only when those application states are recoverable as well.
