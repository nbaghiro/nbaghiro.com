title: When a payment times out
date: 2026-09-13
about: Payments
category: Industry & practice
cover: /img/posts/when-a-payment-times-out-wide.webp
card: /img/posts/when-a-payment-times-out-card.webp
summary: A lost confirmation leaves a payment in an uncertain state. Reliable recovery connects retries, payment records and the message shown to the customer.

When a payment request times out, the application may not know whether the payment succeeded. The request could have failed before reaching the provider, or the provider could have processed it before the response was lost.

Those situations can look identical to the person waiting at checkout. Treating both as a failed payment and inviting a fresh attempt can create another charge. The application needs a way to recover the result of the original attempt.

## Following the request beyond the screen

Consider a customer paying for an order. The server sends the payment request, the provider accepts it and the connection drops before the server receives the response. The customer sees a spinner and then an error.

At this point, the interface has lost information. It has not established that no money moved. A useful design keeps a durable record of the intended payment operation, including the order it belongs to and the identifier used when contacting the provider.

That record gives a later request something to recover. Refreshing the page or returning on another device should lead back to the same order and its payment state, rather than creating a new operation merely because the browser has forgotten the first one.

## Retrying the same operation

An idempotency key lets a provider recognize a repeated request as an attempt to perform the same operation. Stripe's [idempotent-request documentation](https://docs.stripe.com/api/idempotent_requests) explains how keys can support retries after a connection error. For API v1, the first stored response is returned for subsequent requests with that key, including error responses after execution begins. Retention and parameter-matching rules still apply.

The application therefore needs to keep the key with the operation. Generating a fresh key on every retry defeats the connection between attempts. Reusing one key for unrelated purchases creates a different problem: those purchases are supposed to be separate operations.

For the order example, I would establish the operation identity before sending the request and keep its parameters stable during recovery. If the amount changes, that needs an explicit decision about the existing attempt. It should not be hidden inside a retry that was meant to recover an unknown result.

## Keeping payment and fulfillment connected

Recovering the charge is only part of the workflow. Once payment is confirmed, the application may need to reserve a place, release a download or send the order for fulfillment. Those actions also need protection against repetition.

Stripe notes that [webhook events can arrive more than once](https://docs.stripe.com/webhooks). A handler that fulfills an order every time it receives a payment event could repeat that work even when only one payment exists. Tracking processed events helps, and the order's own fulfillment state should also prevent the same business action from being applied twice.

The order and payment records should make these stages distinguishable. A confirmed payment with fulfillment still pending is different from an unpaid order. Keeping that distinction allows the system to retry the unfinished work without asking the customer to pay again.

## Giving the customer an accurate status

During recovery, a message such as checking the payment is more accurate than saying it failed. The customer should be able to return to the order and see whether the result has been confirmed. If the system needs support to resolve it, the order reference gives both parties something specific to investigate.

The interface should only offer a new payment attempt when the application has enough information to do so safely. A timeout alone is insufficient. Equally, an indefinitely spinning screen is not a recovery plan; unresolved states need a way to be investigated and communicated.

I would test this by interrupting the connection after submission, refreshing the page and delivering a repeated notification. The checks would look for one intended payment, one fulfillment action and an order history that explains the result. A successful checkout on an uninterrupted connection does not exercise any of those recovery paths.
