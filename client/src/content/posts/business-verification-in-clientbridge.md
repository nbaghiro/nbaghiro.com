title: Business verification in Clientbridge
date: 2026-11-20
about: Clientbridge
cover: /img/posts/business-verification-in-clientbridge-wide.webp
card: /img/posts/business-verification-in-clientbridge-card.webp
summary: How Clientbridge uses Stripe Connect to collect business verification details, distinguish owner actions from Stripe review, and keep payment and payout status up to date.

When a business owner sets up payments in Clientbridge, they need to provide information about their business and the people behind it. Later, they may need to correct a detail, supply a document or update the bank account receiving their payouts. The product needs to make each next step clear.

We use Stripe Connect's embedded onboarding to collect verification information. Clientbridge creates the connected account, authorizes access to the onboarding component and keeps a local view of the account's requirements and capabilities. Stripe evaluates the submitted information and determines which capabilities are available.

The earlier article, [Running Clientbridge as a Stripe Connect platform](https://nbaghiro.com/blogs/running-clientbridge-on-stripe-connect), explains the account configuration and money flow. This companion focuses on business verification: what the owner supplies, how the application interprets the result and what happens when something changes.

## What the verification process covers

Stripe uses Know Your Customer, or KYC, to describe requirements for establishing who receives funds. For a business, that can involve the legal entity, its representative and people who own or control it. The request can extend to identity or business documents when the supplied information needs further verification.

The exact information depends on the account's country, capabilities, business type, structure, service agreement and risk assessment. A sole proprietor and a company with several owners can encounter different requests. Stripe can also add requirements later. [Stripe's verification overview](https://docs.stripe.com/connect/identity-verification) describes these dependencies.

For that reason, we do not maintain a universal list of documents that every Clientbridge business must upload. The embedded component presents the requirements for the connected account. A product explanation can prepare an owner to provide accurate business and personal details without promising that one fixed checklist covers every case.

This is verification for the business's payment account. It does not establish a client's identity, certify the quality of the business's services or replace any separate obligations Clientbridge may have.

## Who collects the information

Clientbridge uses Accounts v2 with no separate Stripe Dashboard for the business. Its connected-account configuration assigns processing-fee collection and connected-account negative-balance responsibility to Stripe. In this combination, Stripe is also the requirements collector.

That assignment follows the account configuration. It is not a separate flag we use to declare that verification has been delegated. Stripe documents the relationship between dashboard access, loss responsibility and [requirements collection](https://docs.stripe.com/connect/accounts-v2/connected-account-configuration#kyc-requirements).

The owner enters verification details through Stripe's component inside Clientbridge. The integration keeps Stripe user authentication enabled, including when collecting bank-account information. Clientbridge controls who may open the session; Stripe can require its own authentication within that session.

We also provide account management and a notification banner so the owner has a way to respond after the first setup. An account that was ready yesterday can have an additional requirement today.

![The owner provides information through Stripe's component. Stripe reviews the account. Clientbridge reads requirements and capabilities to show the next step.](figure:kyc-responsibilities)

## A session belongs to one business

Opening the component starts with an authenticated request to Clientbridge. The server requires an owner or admin role, resolves the business from that person's membership and obtains its connected-account ID. The request chooses an allowed component; it does not choose an arbitrary Stripe account.

If the business already has an account for its Clientbridge subscription, the onboarding path can add the merchant configuration to that account. An account used to pay for a plan is not automatically ready to collect payments from clients.

The server creates an AccountSession with the component features needed for the requested task. It returns the client secret to the UI and records the component opening in the audit trail. The secret is excluded from the application's stored command responses.

On the client, changing businesses or closing the component invalidates the active session context. A late response must not mount a previous business's session into the newly selected business. That complements the server's membership check; it does not replace it.

This is also a useful privacy boundary. The verification flow uses Stripe's input and upload surfaces. Clientbridge mirrors requirement descriptions, error codes and readiness information for its interface. We do not need to build a second identity-document upload flow to explain an outstanding request.

## A public business page can help supply context

Business verification includes understanding what the business does. Stripe can review the URL supplied on the account and report problems such as an inaccessible page, a mismatch in business information or missing policy details. Its [verification guide](https://docs.stripe.com/connect/handling-api-verification?accounts-namespace=v2#url-verification) describes these checks.

When creating a connected account, Clientbridge can prefill the business's Clientbridge page URL. The helper supplies a configured HTTPS URL and omits the local HTTP address used in development. This is a URL-selection rule, not a live reachability check. Stripe still evaluates the page.

The page connects payment setup to information the business already maintains: its name, services, contact details and booking information.

Publishing the page does not establish that every verification requirement is satisfied. A page can be reachable and still have incomplete or inconsistent information. The legal identity supplied for verification and the public trading name also need to be explained accurately when they differ.

For the owner, the useful next step is specific. If Stripe cannot access the business URL, direct them to that issue and the appropriate correction flow. Asking them to repeat the entire setup gives them less useful information.

## Read requirements and capabilities separately

Accounts v2 exposes open requirements as entries. Clientbridge retrieves the account with both `requirements` and `configuration.merchant` included.

For each requirement, the parser considers who must act, the deadline status and any error codes. Entries awaiting action from Stripe are excluded from the owner's due lists. The application keeps the earliest requirement deadline and the reasons a capability is restricted.

Clientbridge normalizes these entries into local lists named `currently_due`, `eventually_due` and `past_due`. Those are application fields derived from the v2 entries, not a claim that the v2 Account response has the same shape as Accounts v1.

- **Awaiting the user:** information or an action for the owner to address.
- **Awaiting Stripe:** a requirement Stripe is handling; repeating the upload may not be the next step.
- **Requirement deadline:** when an outstanding requirement can become overdue. The affected capabilities still need their own checks.
- **Card-payment capability:** whether the business can currently accept card payments.
- **Payout capability and bank status:** whether payouts are available and whether the destination bank has a known failure.

Stripe documents that capability updates are eventually consistent with requirements. Submitting a requested detail can leave a capability pending while review continues. Closing the onboarding component therefore triggers a status refresh in Clientbridge; the close event itself does not enable payments. See [embedded onboarding](https://docs.stripe.com/connect/supported-embedded-components/account-onboarding?platform=web) and [Accounts v2 verification state](https://docs.stripe.com/connect/handling-api-verification?accounts-namespace=v2).

## Card payments and payouts can have different states

Consider an illustrative business whose card-payment capability is active, but whose payout destination needs attention. Clients may still be able to pay while payouts are paused. A single “verified” badge would hide the part that matters to the owner waiting for money to reach their bank.

Clientbridge derives its card-payment readiness from:

```text
configuration.merchant.capabilities.card_payments.status == "active"
```

Payout readiness comes from the merchant's `stripe_balance.payouts` capability, together with the bank information the integration reads. A bank marked `errored` or `verification_failed` can stop payouts even when the capability itself remains active.

Our local status model includes `not_started`, `pending`, `restricted`, `payouts_paused`, `enabled` and `disabled`. These are interface states. In particular, `enabled` describes the payment readiness represented by this model; it is not a permanent approval or a statement that every possible payment method is available.

![Three possible states: the owner needs to provide details, Stripe is reviewing supplied information, or cards are available while payouts need attention. These are examples, not a fixed sequence.](figure:kyc-owner-states)

Upcoming requirements can coexist with active capabilities. An overdue detail for another capability also does not necessarily disable cards. We read the capability that the operation depends on instead of inferring that every outstanding requirement blocks every payment.

## Keep the local status current

The onboarding path reads Stripe immediately after creating or updating the account. Subsequent account notifications trigger another read. The integration handles requirements changes, merchant capability changes and account closure.

For these account events, Clientbridge obtains the current account state and updates the local business record while holding its database lock. Fetching the account avoids treating an old notification as a complete snapshot of current verification. Serialization protects the local update, but it does not prevent Stripe's state from changing again afterward.

There is also an authorized, rate-limited refresh endpoint for late or missing events, and the recovery job re-reads connected accounts. If a closed account can no longer be retrieved, the closure event is enough to turn off local payment and payout readiness.

![An account notification triggers a fresh Stripe read and updates Clientbridge's local view. An owner refresh and recovery work can also read the account when notifications are delayed.](figure:kyc-status-refresh)

The local record remains a mirror. It helps the product display status and gate its workflow, but Stripe can still reject an operation after a previously successful read. The payment path must handle that result.

There is a narrower fallback worth retaining: if the account is readable but its bank list cannot be retrieved, Clientbridge preserves the last mirrored bank flags. This avoids clearing a known bank failure merely because one read failed. It also means the displayed bank state can be stale until a later refresh succeeds.

## What we check, and what remains to improve

The existing focused tests cover requirement parsing, entries awaiting Stripe, pending review, active cards with paused payouts, bank failures, fresh sessions and authorization across businesses. They also cover reuse of an account that previously only paid for its plan. These tests establish application behavior against controlled inputs; they do not demonstrate that a real business will pass verification.

Stripe's [verification testing tools](https://docs.stripe.com/connect/testing-verification) support exercising simulated verification outcomes. The full product flow also needs checks for closing and reopening onboarding, a newly requested detail, a failed refresh and a capability changing after an earlier read.

Two improvements would make the mirrored state easier to explain. First, show when it was last refreshed and distinguish a failed refresh from an unchanged account. Second, preserve more of the relationship between each requirement, its deadline and its affected capabilities, so the interface can explain a specific impact rather than relying mainly on one summary status.

The goal is for an owner to understand whether they need to act, whether Stripe is reviewing what they supplied, and whether payments and payouts are available. Keeping those answers current is the continuing work behind payment setup.
