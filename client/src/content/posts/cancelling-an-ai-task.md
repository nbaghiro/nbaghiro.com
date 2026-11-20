title: What happens when an AI task is cancelled
date: 2026-11-19
about: FlowMaestro
cover: /img/posts/cancelling-an-ai-task-wide.webp
card: /img/posts/cancelling-an-ai-task-card.webp
summary: Following a cancellation request through the interface, worker, external tools and usage records, with a proposed state model for work that may already have happened.

Someone asks an assistant to research a customer, prepare a document and send it for review. Halfway through, they press Stop. The interface can stop updating immediately. The work behind it may take longer to stop, and an external action may already have completed.

In FlowMaestro, the persona cancellation route resolves the instance within the current workspace, attempts a graceful cancellation signal and also requests Temporal workflow cancellation. The orchestrator has a cancellation flag that it checks at several points. Those are concrete mechanisms for requesting a stop. They do not, by themselves, prove that every provider request has ended or that an external action has been reversed.

The design below separates those outcomes. It is a proposed contract for cancellation, using a research-and-document task as the example, rather than a claim that every part is implemented today.

## Record the request before describing the outcome

We would give a run a durable cancellation request containing the requester, timestamp and operation identity. Repeated clicks should return the same request rather than creating several cleanup attempts. The server should authorize the action against the run's workspace and current permissions.

The interface can then say “Stopping…” while the worker acknowledges the request. A terminal status should describe what the system knows: execution has stopped, completed before the stop took effect, or needs reconciliation because an external result is unknown.

A request that races with completion needs a defined ordering. If completion is already committed, the cancellation handler should not overwrite it with an invented cancelled outcome. If cancellation wins the transition, the worker should stop scheduling new steps and record any work already in progress. A conditional database update or equivalent serialized transition can establish that local ordering.

![A stop request is recorded, the worker acknowledges it, and the run records its final outcome. The interface can show stopping while confirmation is pending.](figure:cancel-states)

An API response acknowledging the request should not be presented as proof that all work has stopped. That distinction is useful even when the usual delay is only a fraction of a second.

## Propagate cancellation through the running work

There are several places to carry the signal: the browser request, the application execution context, the workflow and each activity or tool call. A disconnected browser is not necessarily a cancellation request. A person may switch networks and still expect their job to finish.

For a task designed to continue in the background, cancellation should be an explicit command. For a short request that has no value after the caller leaves, propagating an abort signal may be appropriate. The product needs to choose, rather than letting the HTTP connection decide accidentally.

Temporal distinguishes requesting cancellation from the activity observing it. Its TypeScript guidance explains that regular activities receive cancellation through heartbeats, and that the workflow's cancellation option affects whether it waits. A workflow continuing after requesting cancellation can overlap with an activity that has not yet stopped. [Temporal TypeScript cancellation](https://github.com/temporalio/documentation/blob/main/docs/develop/typescript/workflows/cancellation.mdx)

In our proposed flow, each long-running step would check for cancellation before beginning expensive work and at meaningful checkpoints. Network calls should receive an abort signal where the client supports one. Cleanup needs its own bounded execution context; putting it inside an already-cancelled context can prevent it from running at all.

## An interrupted request can have an unknown result

Suppose the assistant sends a document to an external service. The service accepts it, but the response is lost just as the person presses Stop. The application cannot safely infer that no document was created.

We would record the external operation before sending it, including a stable request identity where supported. After an ambiguous response, recovery would query the provider or reconcile by that identity. Retrying with a new identity could create a duplicate. Marking the operation as successfully cancelled could conceal work that actually happened.

A useful step record might contain:

```text
run_id
step_id
external_request_id
state: planned | submitted | confirmed | unknown
result_reference
cancel_requested_at
```

The state names are illustrative. The important information is whether the action was submitted, whether its result was confirmed and how recovery can find it again. A provider that offers no idempotency or lookup mechanism limits what the application can establish automatically.

![A task has a completed research step, an in-flight document request with an unknown result, and an unscheduled notification. Cancellation preserves the first, reconciles the second and prevents the third.](figure:cancel-effects)

If a message has already been sent, stopping the run does not unsend it. If a private draft has been created, the product may choose to keep it, delete it or offer it to the person. Each tool needs an explicit policy for its results.

## Settle usage from evidence

Cancellation can occur after tokens have been generated or an asset has been processed. Releasing a reservation and deciding what usage to charge are related operations, but they are not the same calculation.

We would keep the reserved amount separate from recorded consumption. On a confirmed stop, the settlement path records the usage it can establish and releases the unused reservation. If usage reporting is incomplete, the run needs a recovery policy that describes the uncertainty. It should not silently equate a missing final response with zero provider cost.

Settlement also races with normal completion. A single operation identity and a guarded final transition should make a later callback return the existing outcome rather than charge or release the same reservation twice. Recovery must follow that same path.

This extends the credit-recovery problem discussed in [Recovering AI credit reservations after a crash](/blogs/recovering-ai-credit-reservations). Cancellation adds a user request, but still needs the bookkeeping to survive a worker disappearing before cleanup finishes.

## Keep partial results understandable

A stopped research task may still contain useful notes. We would label them as partial and retain the run's provenance: which steps completed, which sources were read and which actions remain uncertain.

If the person chooses to continue, the application should distinguish resuming the same durable execution from starting a new task using its partial output. Resuming may preserve completed step identities. Starting again may repeat work and incur new usage. The interface should make that choice visible.

The same principle applies to notifications. “Task cancelled” is appropriate only under the product's defined completion rule. “Stop requested; checking the document request” gives a more accurate account while reconciliation is pending. Operational detail belongs in the status view when it helps someone decide whether to retry or wait.

## Exercise the races deliberately

We would test cancellation before a task starts, while a provider call is running, after an external action succeeds but before its result is saved, and at the same time as normal completion. A worker restart during cleanup needs its own test.

For each case, inspect the external effects and ledger records, not only the run's status field. The checks should establish that new steps were not scheduled after the chosen cancellation boundary, completed effects remain discoverable, and settlement happens once.

A stalled provider or unavailable workflow service also needs a visible outcome. The request can remain pending with bounded retries and an operational alert. It should not become confirmed merely because the interface has stopped polling.

Cancellation is useful when the person can rely on what the status means. The implementation should preserve that meaning from the click through to the worker, the external services and the final usage record.
