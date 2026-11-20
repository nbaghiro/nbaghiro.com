title: Deploying while background jobs are running
date: 2026-11-19
about: Engineering
cover: /img/posts/deploying-with-background-jobs-running-wide.webp
card: /img/posts/deploying-with-background-jobs-running-card.webp
summary: A proposed rollout for changing a queued export job, covering payload versions, worker compatibility, database migrations, retries and the limits of rollback.

An export is queued before a deployment and starts after it. The application that created the job used one payload format. The worker now reading it expects another.

That is a normal situation for background work. A deployment can replace the processes serving new requests while older messages, retries and long-running executions remain active.

FlowMaestro uses durable workflows, which makes this question relevant to its execution model. The example below is a proposed rollout for a fictional export job. It separates message compatibility, database compatibility and workflow-history compatibility rather than assuming that deploying a new worker settles all three.

## Make the queued input a versioned contract

Suppose the first export format contains a document ID and a single locale. A new feature adds different language and formatting preferences. Renaming the old field in application code does not rewrite jobs already in the queue.

We would put a schema version in the payload and make the worker validate it before acting. A decoder can convert supported versions into one internal representation:

```text
version 1:
  document_id, revision, locale

version 2:
  document_id, revision, language, number_locale

decode v1 → language = locale, number_locale = locale
decode v2 → use the explicit fields
```

That conversion is safe only if the old field genuinely meant both things. If the earlier format was ambiguous, a default must be an explicit product decision, not an undocumented guess in the worker.

Unknown versions should fail into an inspectable state before producing external effects. Repeatedly retrying an unsupported payload with the same worker is unlikely to help. The job record should identify the required version and preserve the input needed for recovery.

## Deploy readers before new writers

The first release would add support for both versions while producers continue emitting version 1. Once the compatible workers are available, a later change can enable version 2 production.

During the overlap, the routing arrangement must ensure that a version 2 job cannot reach a worker that only understands version 1. That might mean fully replacing the old worker pool before enabling the new producer, or separating queues by supported contract. Merely adding a version field does not control which process receives the message.

![The rollout first deploys workers that read both versions, then enables version 2 producers, and only later removes version 1 support after old work is accounted for.](figure:deploy-compatibility)

We would retain version 1 decoding until outstanding jobs, delayed retries and supported recovery procedures no longer require it. “The queue is empty” is insufficient if a failed job can be replayed from an archive tomorrow.

The retirement decision needs an inventory: pending messages by version, oldest active execution, retry retention and manual replay paths. That gives the team evidence for removing compatibility code.

## Change the database in compatible steps

A new worker may also need a new database field. During a rolling deployment, old and new processes can use the same database at the same time.

For the example, we would first add the new representation without removing the old one. The application can then write or derive the information needed by both versions while a backfill handles existing records. Reads move to the new representation only after its coverage and semantics are checked.

Dual writing is not automatically consistent. If both fields are updated inside one database transaction, their local relationship can be enforced there. If one is maintained asynchronously, the reader needs a policy for lag and failure. A backfill also needs to avoid overwriting newer user changes with values read earlier.

PostgreSQL documents that schema changes take locks whose strength depends on the operation. We would review the actual migration against production-sized data and the database version, rather than treating an additive migration as necessarily free of disruption. [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

Removing the old field is a separate release. Before that step, confirm that old readers are gone, rollback no longer requires them and the job-replay policy has been updated.

## Preserve the job’s identity across releases

A deployment does not make an old job a new business operation. Retrying an export or notification after upgrading the worker should retain the logical operation ID used to identify its external effects.

The record should separate that identity from the worker build, payload version and attempt number. Those fields answer different questions: what the person asked for, how it was encoded, which implementation processed it and how many times delivery was attempted.

```text
operation_id: stable across retries
payload_version: interpretation of the input
worker_build: implementation that ran this attempt
attempt_id: one execution attempt
input_revision: document version being exported
```

An immutable input revision is useful when the output must match the request. If a retry reads the latest document instead, it may produce different bytes under the same operation identity. That can be intentional, but the contract must say so.

A renderer version may belong in the output-cache key as well. Two releases can interpret the same document revision differently. Reusing an old artifact is a product choice, not a consequence of the payload schema alone.

## Durable workflows have another compatibility boundary

A persisted queue payload is one input. A durable workflow's recorded history is another. Changing the order or meaning of workflow decisions can affect how an existing execution replays.

Temporal supports Worker Versioning and workflow patching for this problem. Its worker guidance describes routing pinned executions to the deployment version associated with them. That is a separate mechanism from decoding an application-defined message version. [Temporal worker deployment guidance](https://docs.temporal.io/best-practices/worker)

For a product using those capabilities, we would verify the routing configuration and test representative recorded histories before the rollout. A new build accepting old JSON does not prove it can replay every old workflow history.

We would also keep old workers available for the executions they still own. Their required dependencies and database access must remain compatible during that period. Pinning code does not preserve a removed database column or an external API that has changed.

![Payload compatibility, shared database compatibility and durable history compatibility are three separate checks. Passing one does not establish the others.](figure:deploy-boundaries)

## Define what rollback can still do

Before enabling the new producer, we would identify a last compatible fallback build. Once version 2 messages exist, a version 1-only worker is no longer a safe general rollback target.

A compatible fallback might be the earlier build that already decodes both formats. If the problem is in the new writer, disable new production while preserving the workers needed to drain existing work. If the problem is in a migration, rolling back application code may not restore the old data representation.

Irreversible external effects need their own recovery path. Redeploying an older worker cannot recall a notification already sent or guarantee that repeating a provider request is safe. Operational rollback and business correction remain different tasks.

## Test the transition, including delayed work

We would create version 1 jobs, pause the workers, deploy the compatible reader and confirm those jobs still run. Then enable version 2, mix both formats and restart workers between submission and acknowledgement.

The test matrix should include unknown versions, old jobs restored from failure storage, duplicate delivery, a concurrent document edit and the chosen fallback build. For durable workflows, replay tests need real representative histories in addition to fresh executions.

During rollout, monitor unsupported-version errors, job age and outcomes grouped by payload and build. A falling queue depth can hide old jobs that never complete while newer ones finish quickly.

A safe deployment plan accounts for work created before the release and work that might be retried after it. Versioned inputs, compatible readers and an explicit retirement point make that overlap something the system can handle deliberately.
