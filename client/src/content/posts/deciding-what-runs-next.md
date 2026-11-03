title: Deciding what runs next in a workflow
date: 2026-11-03
updated: 2026-11-03
about: FlowMaestro
cover: /img/posts/deciding-what-runs-next-wide.webp
card: /img/posts/deciding-what-runs-next-card.webp
summary: FlowMaestro builds an execution plan in four passes, then tracks which nodes are ready to run. The dependency rules determine what starts next, which branches are skipped, and how failures affect the rest of the run.

FlowMaestro workflows are drawn on a canvas: triggers, calls, conditions and outputs joined by edges. Those edges express ordering, but execution also needs rules for reachability, loops, skipped branches and joins. The builder resolves the graph into the dependencies and edge types the scheduler uses.

Turning that picture into something a worker can execute is a separate step, and it runs at the start of every execution. It produces three things: the nodes the trigger can actually reach, every edge typed by the handle it leaves from, and a list of dependencies for each node.

![The nodes and edges from the canvas pass through four stages and come out as an execution plan.](figure:drawn-to-plan)

## Four passes over the drawing

`buildWorkflow` runs four passes in order.

The first walks the graph breadth-first from the trigger. The trigger is whichever node the definition names as its entry point, or the first input node, or the first node with no incoming edges. Nodes the walk cannot reach are dropped and recorded as a warning, so a disconnected node left on the canvas does not take part in the run. Every node it does reach gets a depth.

The second pass handles loop nodes. A loop node is replaced by a start sentinel and an end sentinel, and the edges around it are rewired onto those two.

The third expands nodes marked parallel into their branches and rewrites the dependencies to match. The fourth types every edge with the handle it leaves from: default, true, false, or a named switch case. That typing is what later lets a conditional identify which of its targets belongs to the branch it did not take.

All four are pure functions, and that matters because they run inside the Temporal workflow rather than as an activity. A workflow has to produce the same result when it is replayed from history, so anything with a side effect belongs on the other side of that line. One import in the builder reaches into a module rather than the package index for the same reason, to keep zod out of the workflow bundle.

The result also carries a set of execution levels, grouping nodes by depth. They are used to validate the plan and to summarise it. The scheduler does not read them. What it reads is the dependency list.

## What decides the next node

Execution keeps six sets: pending, ready, executing, completed, failed and skipped. A node with no dependencies starts in the ready set and everything else starts pending. The loop takes as many ready nodes as the concurrency limit allows, which defaults to ten and can be set per workflow, runs them, and then works out what has become ready.

The rule for becoming ready has two cases.

A node with exactly one dependency becomes ready when that dependency has completed. Nothing else counts, so a failure or a skip upstream leaves it where it is.

A node with more than one dependency waits until every one of them has settled, meaning completed, failed or skipped, and then runs only if at least one of them completed.

For a join after a conditional, the chosen branch can complete while the other is skipped. All dependencies have settled and one succeeded, so the join runs. The dependency rule can be read as:

```
Dependencies              Settled state                 Outcome
None                      No upstream work              Initially ready
One                       Parent completed              Ready
Several                   All settled; some completed   Ready
Several                   All failed or skipped         Skipped
Any                       Still waiting on upstream     Pending
```

Skip propagation and failure handling update these sets between batches; a pending set with no possible progress produces the deadlock error described below.

![Six batches of one run, with the branch that was not taken drawn open.](figure:batch-by-batch)

A small triage workflow makes that concrete: a trigger, two independent calls, a conditional, two branches, a join that writes the result and an output. Eight nodes and nine edges. It runs in six batches. The trigger alone, then the two calls together, then the conditional, then the branch it chose, then the join, then the output. One node is skipped and never runs at all.

## The batch is a barrier

The ready set is recomputed after every batch, which is what makes it follow the skips instead of a precomputed order. The batch itself, though, is run with `Promise.all`, so nothing in the next batch starts until the slowest node in the current one has finished.

For the triage workflow that costs little. For a workflow where one branch is a ten-minute model call and another is a fast database write, the fast node's dependents wait on the slow one even though they do not depend on it. The information needed to do better is already in the plan. The loop does not use it that way today, so the accurate description is that execution is batched rather than fully dependency-driven.

There is a guard for the case where nothing can move. If the ready set is empty and nothing is executing while nodes are still pending, the loop raises a deadlock error instead of waiting.

## When something fails

A node failure does not immediately abort all remaining work.

Because a node with several dependencies only needs one of them to have completed, a failure beside a success is survivable. In the triage workflow, if one of the two parallel calls fails and the other succeeds, the conditional still runs, and so does everything after it. Six nodes complete, one fails, one is skipped, and all six batches go through.

If the failure lands on the branch that was taken, the picture changes. The join's other parent was already skipped, so now every one of its dependencies has failed or been skipped, and the join is skipped too. Skipping then walks forward: the output loses its only parent and is skipped as well. Four nodes complete, one fails, three are skipped, and the run ends after four batches.

![Two runs of the same workflow, one where the join keeps a completed parent and one where it does not.](figure:when-something-fails)

In both cases the run is reported as failed once the loop ends, along with the node that failed and its error. The difference is how much of the workflow got to run first.

Whether that is the right behaviour depends on the workflow. Finishing the independent work is useful when the branches really are independent. It is less useful when a later node would have been better off not running because an earlier one failed. There is no per-node setting for that today, which is the main thing I would add here next.

## Inside the workflow, and outside it

Four node types are evaluated in the workflow itself with no activity: input, conditional, and the two loop sentinels. Everything else goes through a single `executeNode` activity.

The split follows Temporal's replay model. A conditional derives its decision from recorded workflow context. An external call belongs in an activity whose result can be recorded and reused during replay. That does not mean its side effect executes once: an activity can perform the external action and fail before its completion is recorded, then be retried. Payment, message and other side-effecting activities need stable operation identities or a recovery check at their external boundary.

The activities have different timeouts. Node execution gets ten minutes, standard calls two minutes, validation thirty seconds and event emission five. Node execution allows up to three attempts with backoff. Validation and event emission are configured without retries. For events, that trades fewer duplicate attempts for possible missing notifications; it is a delivery policy, not evidence that duplicates are always worse than loss.

The orchestrator also handles signals to cancel, pause and resume a run, and to deliver a human review response, and it answers queries for progress, for one node's status and for a summary. Those queries read the same queue state as the scheduler. The client still needs to handle delays between a query response and its next display update.

The scheduler resolves readiness after each completed batch. Its dependency rules allow some work to continue after a failure, while the batch barrier can delay work whose own parents have already finished. Per-node failure policies and earlier scheduling of newly ready work are separate improvements to that model.
