title: Undoing a change across services
date: 2026-11-19
about: Clientbridge
cover: /img/posts/undoing-a-change-across-services-wide.webp
card: /img/posts/undoing-a-change-across-services-card.webp
summary: A proposed booking-change workflow that distinguishes database rollback from corrective actions in calendars, reminders and payments, including retries and concurrent edits.

A customer moves an appointment from Tuesday to Thursday. The booking changes in the application, the calendar is updated and a confirmation is sent. A minute later, the business wants to put it back.

The booking row is only part of that change. Tuesday's slot may already have been taken, the customer may have read the confirmation, and another service may still be processing Thursday's calendar update.

Clientbridge combines booking, communication and payments, so this is a useful example to design through. The workflow in this article is a proposal for coordinated correction across services. It is not a description of an existing universal Undo feature.

## Start with what the action promised

We would distinguish three operations in the product: cancel an uncommitted edit, change a confirmed booking again, and compensate for a partially completed workflow. They have different effects.

An edit still confined to a local form can usually be discarded. A database transaction can roll back its own uncommitted writes. Once an external service has accepted an action, correction requires another operation that the service understands.

For a confirmed move, the request should identify the booking and the revision the person saw. The server checks current permission and current booking state. It also checks whether the proposed destination is available now. Remembering that Tuesday was free before the original move does not reserve it indefinitely.

If another person has already changed the booking, we would show the current state and ask for a new decision. Applying an old snapshot could erase that later change.

![An appointment moves from Tuesday to Thursday. Returning it to Tuesday requires a new availability check, a new booking revision and follow-up work for external systems.](figure:undo-new-command)

## Store the correction as a new command

We would treat the return to Tuesday as a new command linked to the original move. It gets its own operation ID, actor, expected revision and requested time. The audit trail keeps both actions.

Within one database transaction, the server checks the revision and availability, commits the new booking state, and records the external work that follows. The external work might include calendar synchronization, reminder replacement and a correction message.

```text
authorize(actor, booking)
lock_and_check_revision(booking, expected_revision)
check_availability(requested_time)

write_booking_revision(requested_time)
record_follow_up_operations(command_id)
commit
```

This is illustrative ordering, not production code. The availability check must coordinate with competing bookings, and the exact lock or constraint depends on the scheduling model. We explored that separate problem in [Deciding whether a booking slot is free](/blogs/when-a-slot-is-free).

Saving the follow-up work with the booking prevents a process crash immediately after commit from losing the calendar update altogether. It does not make the calendar and database one transaction. A worker still needs to deliver and reconcile the operation.

## Correct each external effect on its own terms

A calendar event can often be updated using its remote ID. A queued reminder can be cancelled if it has not been sent. A delivered message usually needs a follow-up message. A payment may require a separate adjustment with its own eligibility and confirmation rules.

We would record the intended corrective action per effect, rather than label every one “rollback.” Microsoft’s compensating-transaction pattern makes the same general distinction: recovery may require new work and must account for concurrent changes rather than simply restore an earlier snapshot. [Compensating transaction pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction)

The product should not automatically infer a refund from every booking correction. The business policy needs to decide whether the change affects the amount owed, a deposit or neither. The implementation then follows the approved action and records its result.

![Calendar work can update an existing event, an unsent reminder can be replaced, and a delivered confirmation needs a new correction. Each effect has a separate result.](figure:undo-effect-policy)

Some effects have dependencies. A correction message should not announce a time that the application failed to reserve. Other work can proceed independently: a temporary calendar outage need not prevent the business from seeing the confirmed booking in its own schedule.

## Prevent an older update from arriving last

The original Thursday update may still be queued when the Tuesday correction is created. If workers deliver them out of order, the calendar could finish on Thursday even though the booking is now Tuesday.

We would attach a booking revision to each synchronization request. Before delivery, the worker compares the request with current desired state. An obsolete request can be skipped in favor of the latest revision. If an earlier external request is already in flight, per-booking serialization or a follow-up reconciliation is still needed.

Checking a revision before sending does not prevent it changing during the network call. Where the provider supports conditional updates, those can help enforce ordering. Otherwise the application must retain enough state to detect that an older result landed and send the current desired version again.

A stable remote event identity matters too. Creating a new event for every retry can leave several appointments in the calendar. The worker should know whether it is updating the existing event, discovering an ambiguous creation result or deliberately creating a replacement.

## Give retries stable identities

A corrective operation can fail after the provider accepts it but before the application saves the response. Retrying safely requires a stable identity and a way to recover the result.

We would store each effect with a state such as pending, submitted, confirmed or needs review, plus the remote reference and attempts. A retry reuses the same logical operation. A genuinely new booking change receives a new operation linked to a later revision.

For providers without a useful idempotency or lookup mechanism, the system may not be able to resolve every ambiguous result automatically. That case needs a review path rather than an unlimited retry loop. Human intervention should act on the same operation record so it does not create an unrelated second correction.

The booking state and synchronization state should remain distinct in the interface. “Booking restored; calendar update pending” tells the business what is confirmed and what still needs attention.

## Keep the history useful without duplicating private data

An audit record should explain who requested the correction, which revision it applied to, what was accepted and which external operations followed. It does not need to copy every customer note or full provider response into a permanent log.

The history also helps distinguish a failed original action from a successful action later changed by a person. Those are different support cases. Repeatedly editing the same database row without command history makes them difficult to reconstruct.

We would keep operational identifiers and error categories in ordinary logs, with sensitive details restricted to the systems that need them. Retention for command history and provider payloads should be deliberate rather than an accidental consequence of logging everything.

## Test the whole sequence

A useful test moves the booking, pauses calendar delivery, moves it back, then releases the queued operations in the wrong order. The final calendar should converge on the current accepted booking revision.

Other cases include the old slot being taken, a competing edit, a reminder sent just before cancellation, a provider timeout after success, and a worker restart during correction. Tests should inspect the booking, external operations and customer-facing status together.

The goal is a correction the business can understand. Some effects can be reversed, some can be replaced and some can only be followed by another action. Recording those outcomes separately makes recovery clearer than promising that one button returns every system to its previous state.
