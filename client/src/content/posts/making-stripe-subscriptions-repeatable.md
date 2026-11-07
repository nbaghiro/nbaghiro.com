title: Making Stripe subscriptions repeatable
date: 2026-11-07
about: Engineering
cover: /img/posts/making-stripe-subscriptions-repeatable-v2-wide.webp
card: /img/posts/making-stripe-subscriptions-repeatable-v2-card.webp
summary: How I automate Stripe catalog setup and reuse subscription patterns, with examples of price changes, checkout retries, webhook transactions, and product access rules.

Adding subscriptions to a new product brings back a familiar set of tasks. Define plans, create prices, connect customers to accounts, open checkout, handle renewals, and decide what access someone has when their payment status changes.

Across the products I work on, much of that structure repeats. I’ve automated the catalog setup and built patterns for checkout retries, subscription updates, and duplicate events. I’m shaping that work into standalone billing tooling that can live outside the individual product repositories.

The intended boundary is straightforward: shared tooling owns the setup process and lifecycle handling; each product supplies its catalog, account mapping, and access rules. The examples below come from working implementations that inform that separation. Packaging them together is a further step, rather than something every product already installs unchanged.

This article is about a web product selling its own recurring subscriptions. A marketplace collecting payments for other businesses, or an app selling through an app store, has additional requirements.

## The parts that repeat

I split the integration into three areas:

1. **Stripe setup:** products, prices, portal features, and event delivery. The plan catalog, currency, URLs, and supported customer actions change by product.
2. **Application runtime:** authentication, checkout, event processing, and stored billing state. The payer might own a user account, workspace, or organization.
3. **Access and operations:** limits, recovery, and verification. Trials, allowances, grace periods, upgrades, and cancellation policy need explicit rules.

Stripe handles payment collection and recurring billing. My application still needs to connect that billing to the right account and decide what the account can do. Treating those as separate responsibilities makes the code easier to reuse.

## Turning the catalog into setup code

Plans are defined in a typed catalog. The setup script reads that catalog instead of maintaining a second list of names and amounts for the Stripe Dashboard. In the standalone tooling, the catalog would be an input supplied by each product.

Each managed product has a stable metadata identifier. Each price has a lookup key, using a product namespace, for example `product_pro_month` or `product_pro_year`. The script looks up those objects and compares their configuration before deciding whether to create or update anything.

For a price, the comparison includes the product, currency, amount, recurring interval, and active status. Checking only the name would miss a yearly price accidentally configured as monthly. Checking only the amount would miss a price attached to the wrong product.

Annual pricing also needs an explicit unit. If the catalog stores the effective monthly rate for an annual plan, the annual charge is twelve times that amount. The script performs that conversion before creating the yearly price. A pricing label and a charge amount are related, but they are not always the same number.

The existing setup exposes three commands. A standalone runner would preserve these operations:

```sh
# Report the changes without writing them.
pnpm stripe:setup --dry-run

# Configure the test environment.
pnpm stripe:setup

# Exit unsuccessfully when the checked settings differ.
pnpm check:stripe
```

Providing the application's HTTPS origin lets the script configure or check the webhook URL and portal links. Without an origin, it skips the webhook check. A successful check therefore needs to be interpreted with its inputs, rather than treated as proof that every part of billing is ready.

Live mode requires an explicit flag and a live key. The script refuses a live key when that flag is missing. It outputs the identifiers needed by the application, but installing those values in the deployment is still a separate step.

## A price change is also a migration decision

![Changing the catalog determines the price for new purchases. Moving existing subscribers is a separate operation.](figure:subscription-price-change)

Stripe prices are versioned objects in practice: changing the amount requires creating another price. Archiving a price prevents new purchases with it while existing subscriptions can continue using it. [Stripe’s price management documentation](https://docs.stripe.com/products-prices/manage-prices) explains those rules.

The setup script creates a replacement when the desired price differs, transfers the lookup key, and archives the previous price. New purchases can resolve to the replacement without changing the logical plan name in application code.

Existing subscribers do not automatically move to the new amount. That needs a separate decision about grandfathering, notification, timing, and any billing adjustment. A script that silently changed every subscriber while synchronizing the catalog would combine two very different operations.

The setup also limits cleanup to objects identified as belonging to the selected product. It should not archive unrelated products in the same Stripe account.

This is useful repeatable provisioning, but it is not a database transaction across Stripe. Two setup processes running at once can race, and a failure can leave some operations completed. I run catalog changes as a controlled deployment step and inspect the resulting differences. The script is also specific about what it compares; it does not currently detect every possible setting, including an existing webhook endpoint’s API version.

## Checkout needs a durable identity

Before opening checkout, the server needs to answer two questions: who is allowed to purchase, and which account should receive the subscription?

In one implementation, the billing customer belongs to a workspace. In another, the billing flow resolves the signed-in person and their stored Stripe customer. That distinction affects authorization, database relationships, and which account receives access after payment.

The browser should send a supported plan and billing interval. The server resolves those to an allowed price and a customer it owns. Accepting an arbitrary customer identifier from the browser would let a caller cross account boundaries. Accepting arbitrary prices would let the browser bypass the product’s supported catalog.

There is also a less obvious problem: a successful request to Stripe can be followed by a failed response to the application. If the user clicks again, the application needs to recover the original checkout instead of creating another purchase opportunity.

The checkout implementation stores purchase intents in the database. An intent records the requested purchase, a Stripe idempotency key, processing status, and the resulting session. Its schema restricts a workspace to one open subscription intent. A lease coordinates workers while a request is in progress, and a retry can reuse the same key.

That is more useful than generating a fresh idempotency key on every HTTP request. A fresh key describes a new operation, even if the customer is retrying the same purchase. Stripe’s [idempotent request behavior](https://docs.stripe.com/api/idempotent_requests) provides the API mechanism; the application has to preserve the identity of the purchase attempt.

Stripe’s API v1 idempotency keys can be removed after at least 24 hours. The stored checkout intent is therefore useful beyond holding a key: it records the resulting session so recovery can inspect that purchase instead of assuming Stripe will remember the key indefinitely.

The checkout return page is a place to show progress and fetch billing status. Reaching that URL is not evidence that payment succeeded. The server must verify the billing result independently.

## Webhooks update the application’s view of billing

Renewals and payment failures happen without the customer visiting the product. Stripe sends events so the application can react to them. The [subscription webhook documentation](https://docs.stripe.com/billing/subscriptions/webhooks) describes the lifecycle events, including subscription changes and invoice outcomes.

The webhook handler verifies the signature against the raw request body before processing the event. Stripe can redeliver events and does not guarantee their delivery order, so handling cannot assume each event arrives once in chronological order. Those requirements are covered in [Stripe’s webhook documentation](https://docs.stripe.com/webhooks).

For relevant subscription events, the handler fetches the current subscription from Stripe before updating local state. That avoids blindly applying an older event payload after a newer one. Another implementation fetches the customer’s subscriptions when synchronizing its plan. Both use the event as a reason to refresh the application’s view of billing.

Fetching current state reduces one source of stale updates. It does not, on its own, solve every concurrency problem: two workers can fetch at different times and finish their writes in reverse order. A broader reusable implementation needs a deliberate coordination or reconciliation strategy for that case. I would not describe a current-state fetch as a complete ordering guarantee.

The handler also records processed event IDs. The important detail is that the receipt and its database effects are committed in the same transaction:

![A webhook receipt and its billing changes commit together. If processing fails, neither is saved, so a later delivery can retry.](figure:subscription-webhook-commit)

If processing fails, the receipt rolls back with the changes. A later delivery can try again. Recording the event as processed before applying its effects would risk losing the update permanently after a failure.

Product events are queued in a database outbox alongside the billing changes. That separates recording a purchase from sending its downstream notifications. Delivery from the outbox still needs retries and consumers that tolerate duplicates; the transaction does not make external systems part of the same atomic operation.

## Duplicate events and duplicate allowances are different problems

One paid period can produce several distinct events. Deduplicating by event ID alone does not stop all of them from granting the same allowance.

For a product that includes credits with its paid plans, I give the allowance its own business identity. The grant is keyed by the paid period and plan. Different events reporting that same paid period reach the same grant rather than each adding credits.

This matters during checkout, renewal, and plan changes. It also explains why a generic webhook handler is only part of a reusable billing implementation. The application needs an invariant such as “this paid period grants its allowance once,” then a database constraint and transaction that enforce it.

For a product without credits, the invariant might instead concern seat allocation or provisioning a workspace. The useful pattern is to identify the business operation separately from the event that happened to report it.

## Access rules belong to the product

A subscription status is an input to access decisions, not a complete access policy.

A trial may allow the full product or a limited version. A failed renewal may start a grace period. Cancellation scheduled for the end of a paid period may leave access in place until that date. An upgrade may need to wait for its payment before unlocking more capacity.

One implementation has explicit rules for this. An unpaid upgrade does not immediately raise the local plan. A downgrade within the current paid period can be recorded as pending. Allowance calculations also account for the unused portion of an earlier period when a change replaces it.

Another implementation makes different choices. Its synchronization code treats `past_due` as a paid-plan state alongside `active` and `trialing`, while stopped states follow a separate path. That is a product policy encoded in the application, not a general statement that a past-due subscription has been paid.

The portal configuration follows the same principle. One configuration enables payment-method updates and invoice history there, while keeping subscription changes and cancellation in the application flow. Automatically enabling every portal feature would create another route for changing billing that the product needs to support correctly.

These are the settings I want to make explicit when adapting the implementation. Copying the code without reviewing them would also copy another product’s business rules.

## Testing the failures that repeat

The existing billing tests cover more than a successful checkout. There are cases for repeated clicks, concurrent first purchases, retrying after a request fails at Stripe, expired sessions, redelivered events, and transaction rollback. There are also checks that several events for one paid period do not grant the allowance again.

Those tests are valuable reusable material because the failure modes recur across products. They make the expected behavior concrete before changing the integration.

They are not proof that a deployed Stripe account is configured correctly. Test doubles can miss provider behavior, and application tests do not establish that a live endpoint has the right signing secret or event selection.

I treat verification as three separate checks: application tests for our rules, the setup check for the configuration it understands, and an end-to-end exercise against Stripe’s test environment. For time-dependent behavior, [Stripe test clocks](https://docs.stripe.com/billing/testing/test-clocks) can advance supported billing scenarios through renewals and other lifecycle changes.

## What the shortcuts actually save

The repeatable work is now represented in code: the catalog becomes Stripe configuration, checkout attempts have durable identities, events have transactional receipts, and allowances have their own deduplication rules. That is a much stronger starting point than remembering which Dashboard settings I changed for the previous product.

The remaining work is still meaningful. A new product needs its account mapping, plan limits, access policy, customer-facing flows, and deployment configuration. Account activation and the business inputs required for tax configuration also sit outside this setup script.

The standalone tooling should expose stable interfaces around those differences: a catalog, a customer resolver, an access policy, and persistence adapters. Keeping that tooling outside the product repositories would let fixes to shared behavior be released once and adopted through a versioned dependency. Each product would still own its configuration and integration tests. The existing implementations provide the behavior to extract and verify.

The benefit is not that subscriptions become a single API call. It is that the repeated decisions and failure handling no longer have to start from an empty file.

