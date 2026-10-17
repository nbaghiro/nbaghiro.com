title: When a payment times out
date: 2026-10-17
about: Payments
category: Industry & practice
cover: /img/posts/when-a-payment-times-out-wide.webp
card: /img/posts/when-a-payment-times-out-card.webp
summary: A lost confirmation leaves a payment in an uncertain state. Reliable recovery connects retries, payment records and the message shown to the customer.

A payment screen can time out after the payment has succeeded. The connection may have failed while the confirmation was coming back.

That leaves the customer in an awkward position. Trying again might complete the purchase, or it might create a second charge. Closing the page leaves them unsure whether they have paid.

## Recovering the result

Payment APIs address this with an idempotency key: an identifier that lets a retry refer to the same operation. [Stripe documents this behavior](https://docs.stripe.com/api/idempotent_requests) so a client can repeat a request without creating another operation for the same key.

The interface needs to reflect that uncertainty too. “We are checking your payment” is more accurate than “Payment failed” when the system has not established what happened.

A useful checkout test is to interrupt the connection just after submission. Then check the payment record, the order and what the customer sees when they return. The recovery should leave them with one purchase and a clear answer.

## Keeping track of the same purchase

A retry needs a stable relationship to the original request. Generating a new identifier every time someone presses the button makes each attempt look like a new operation. Reusing an identifier for an unrelated purchase creates a different problem. The identity belongs to the intended operation, not simply to a browser session or customer.

The payment provider’s rules matter here. A retained key has a defined lifetime, and requests that fail before execution can be handled differently. Idempotency is one part of recovery; it does not remove the need to check the resulting payment and order records.

## Testing the uncertain state

A useful test includes returning to the purchase from a fresh page. The browser that submitted the request may no longer exist. The application still needs enough information to establish what happened and display the result.

It is also worth checking the wording for each state. Confirmed success, confirmed failure and a result still being checked are different situations. Showing them distinctly helps the customer decide whether to wait, change a payment method or contact support without guessing whether another attempt will charge them again.
