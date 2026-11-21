# Business verification in Clientbridge

Reviewed 20 November 2026. Article: `business-verification-in-clientbridge`.

## Primary documentation

Read using Stripe CLI 1.55.14. The article uses Accounts v2 requirement entries and capability statuses; it does not apply an Accounts v1 field checklist to v2.

- https://docs.stripe.com/connect/accounts-v2/connected-account-configuration — requirements collector derives from dashboard and loss-responsibility configuration.
- https://docs.stripe.com/connect/identity-verification — why information varies by account; ongoing requirements; independent platform obligations.
- https://docs.stripe.com/connect/handling-api-verification?accounts-namespace=v2 — requirement entries, action owner, deadlines, errors, capability consistency and business-URL checks. Some lower sections of this page still contain v1 terminology; the article uses the v2-specific sections and the implementation.
- https://docs.stripe.com/connect/supported-embedded-components/account-onboarding?platform=web — account onboarding, collection options, authentication and refresh after exit.
- https://docs.stripe.com/connect/testing-verification — simulated verification behavior, distinguished from real verification outcomes.

This is an implementation article, not an exact requirements checklist for a particular business/legal structure. It deliberately does not assert fixed ownership thresholds, a universal document list or guaranteed approval times.

## Implementation evidence

Paths relative to the Clientbridge repository:

- `backend/src/clientbridge/integrations/stripe.py`: `account_status_from`, `_bank_flags`, `create_connected_account`, `create_account_session`, `get_account`, v2 event names.
- `backend/src/clientbridge/core/config.py`: `stripe_page_url` checks the configured URL's HTTPS scheme, not live reachability or a business publication flag.
- `backend/src/clientbridge/services/business.py`: `derive_kyc_status`, `apply_account_status`, local due-list and bank-flag semantics.
- `backend/src/clientbridge/services/payments.py`: role checks, membership-derived account, component allowlist, fresh secret, immediate read, rate-limited refresh and current-account mirroring under a business lock.
- `frontend/packages/app-core/src/domain/gettingPaid.ts`: refresh on closing account UI, invalidation on business/session changes.
- `frontend/packages/ui/src/web/PaymentAccount.tsx` and `PaymentNotices.tsx`: embedded onboarding, management and notification banner.
- `backend/tests/test_payments_connect.py`: controlled-input tests for parsing, capabilities, bank issues, account reuse and session authorization. Reviewed, not executed as part of this editorial change.

## Deliberate limits

The article identifies local status as a mirror, preserves the bank-read fallback limitation, and labels richer requirement-impact mapping and visible freshness as proposed improvements. It does not claim that closing onboarding enables payments, that an active card capability enables every method, or that embedding Stripe removes every platform obligation.

The cover reuses the companion Connect article's credited photograph to connect the two pieces visually. The body contains three responsive diagrams.
