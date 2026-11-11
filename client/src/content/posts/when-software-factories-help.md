title: Where software factories are useful
date: 2026-11-10
about: Engineering
category: Industry & practice
cover: /img/posts/when-software-factories-help-wide.webp
card: /img/posts/when-software-factories-help-card.webp
summary: Software factories become more useful when repeated operational work grows with product usage. Incident triage shows what to automate, what to keep under review, and how to tell whether the extra machinery is helping.

I would not build a software factory as the default way to develop a new product. When the product is still changing quickly, much of the work is deciding what should exist and trying it with people. A system that keeps generating changes can add more work to review before those decisions are clear.

The case becomes stronger when the team repeatedly handles the same kinds of operational work. As usage grows, more requests can mean more alerts to investigate, more failed jobs to inspect, and more support reports to connect to an existing problem. The investigation often begins with the same questions, even when the eventual fix differs.

That is where I find the idea useful: a durable process that gathers evidence, investigates a bounded problem, and brings back something an engineer can assess. The amount of automation should follow the work that actually repeats.

## What I took from Gumloop's approach

Gumloop's [Software Factory article](https://www.gumloop.com/engineering/software-factory) describes specialized workflows around production signals and engineering tasks. Each has an engineer responsible for it. Agents investigate and prepare changes with supporting checks; engineers retain the merge decision. The company reports substantial throughput and performance improvements from its own deployment.

I read that as a useful case study, rather than evidence that every team should reproduce the whole system. Its results belong to its workload and operating conditions. My interest is in where a smaller version would save repeated effort, and what it would cost to maintain.

I previously wrote about [why I stopped pursuing a software factory](/blogs/why-i-stopped-pursuing-a-software-factory) for my own product work. I still want a short path between trying a feature and deciding what to change. Automating recurring operational investigation is a more specific use case, with a clearer starting point and a result that can be checked.

## Start with the repeated task

Imagine an engineer gets an alert about delayed background jobs. They open the queue dashboard, find affected job IDs, inspect recent deployments, read the relevant logs, and look for similar incidents. Another engineer repeats that work the following week.

There are several possible improvements. A dashboard could put the evidence together. A script could collect it for a given time window. An agent could investigate the parts that vary. A persistent workflow could coordinate that investigation across services, people, and several hours.

Those options have different costs. A deterministic query does not need an agent to decide how to run it. An occasional investigation may need one coding session rather than a scheduler, task queue, memory store, and several handoffs. Persistent orchestration becomes useful when work must survive interruptions, wait for outside results, and retain its state between attempts.

![Use a script for known steps, an agent for bounded investigation, and a durable workflow when the work needs coordination across time. These are choices for a task, not maturity levels.](figure:factory-task-fit)

Google's SRE book describes [toil](https://sre.google/sre-book/eliminating-toil/) as recurring operational work that can grow with the service without leaving a lasting improvement. That is a useful test here. Collecting the same evidence repeatedly is a candidate for automation. Deciding what a new product should do is a different kind of work.

Growth makes the first problem more expensive, but team size alone is a poor trigger. A small team running a busy service can have substantial repetitive work. A larger team working on unfamiliar problems may have little that fits one stable workflow.

## A concrete incident workflow

Consider a fictional booking service. Appointments are being saved, but confirmation emails are delayed. Support receives several reports that customers cannot tell whether their booking went through.

I would begin with an automated evidence collector. Its inputs would be the service, environment, alert window, and incident identifier. It would retrieve queue age, error counts, recent release IDs, and a small sample of linked job traces. It would retain the query windows and collection times alongside the results, so a responder can tell which observations are current.

The first report might establish that appointments are being committed successfully, confirmation jobs are accumulating, and one worker pool began reporting timeouts after a release. Those are observations. “The release caused the delay” remains a hypothesis until the investigation supports it. A provider outage or a database connection problem could produce some of the same symptoms.

The workflow should attach new evidence to the existing incident where appropriate. Opening a separate investigation for each support message can waste resources and scatter the response. A fingerprint based on environment, component, and error class can suggest a match, but an engineer must still be able to split unrelated failures that happen to look similar.

![Several signals contribute to one incident record. Evidence collection leads to investigation, while a responder controls mitigation. A repair can be prepared separately and checked after release.](figure:factory-incident-flow)

Once that record exists, an investigating agent can follow the timeout through the code, inspect the relevant change, and propose a reproduction. It should return references to the evidence, an explanation of the failure, the proposed scope, and unresolved questions. “Could not reproduce” is a useful result when it prevents an unsupported patch.

That would remove repeated setup from the responder's work without asking the agent to run the entire incident.

## Separate restoring service from preparing a repair

During an outage, a new pull request may not be the fastest way to restore service. A known rollback or an existing runbook may be more appropriate. The investigation can continue while responders choose the mitigation.

Google's [incident-response guidance](https://sre.google/workbook/incident-response/) separates restoring service from coordinating the response and keeping people informed. An automated workflow should fit those responsibilities. It should not introduce a second, uncoordinated source of production changes because it found a plausible explanation.

For the booking example, suppose the evidence points to a worker configuration change. A responder could approve restoring the previous configuration, provided it remains compatible with the current system. Meanwhile, a coding agent could prepare a regression test and a permanent correction in an isolated environment.

The actions need different permissions. Evidence collection can use scoped read access. Reproduction and patch preparation can run outside production. Applying a mitigation requires an explicit action policy, current preconditions, and an identified owner. Keeping these boundaries separate also makes it possible to continue investigation when permission to change production is unavailable.

Some repeated mitigations can eventually run automatically. I would require a narrowly defined condition, a tested action, a concurrency limit, and a clear escalation path. A worker restart, for example, is not harmless merely because it is familiar: in-flight work must have defined retry and recovery behavior. Repeated restarts can also hide the original fault.

## A test result answers a limited question

A test that fails before a patch and passes afterward is useful evidence. Its value depends on whether it reproduces the relevant failure and checks the intended behavior.

For delayed confirmations, I would want the test to cover the point where the worker times out, what happens on retry, and whether a successful send with a lost acknowledgement can produce a duplicate. A test that simply asserts the new timeout value would say very little about the incident.

The review should also check what the patch leaves unchanged. Does a larger timeout occupy connections for too long? Does retrying create more pressure on an already overloaded dependency? Does a change that helps one customer delay everyone else?

After deployment, the evidence changes again. Passing tests do not establish that queue age or delivery latency improved in production. The workflow should compare the relevant measurements over an agreed observation window and retain a pending state if it does not yet have enough data. A merged change and a resolved incident are separate outcomes.

This is where I would measure the workflow's usefulness: less time collecting context, faster movement toward a supported decision, and fewer recurrences. Counting generated patches alone misses those results.

## The automation needs recovery too

Once a workflow runs unattended, its own failures become part of the system. A worker can disappear while investigating. A tool call can time out after opening an issue. A retry can create another pull request for the same job.

I would give each job a durable identity and explicit states such as collecting, investigating, awaiting review, applying, and observing. A claimed job needs an ownership policy, an expiry or heartbeat, and a bounded retry budget. An expired claim permits recovery; it does not prove the original process stopped doing work.

External actions need separate handling. If an issue-create request loses its response, the retry should look for the existing result through a stable correlation identifier or use a supported idempotency mechanism. Assuming a timeout means nothing happened is how duplicate tasks accumulate.

The workflow also needs limits on its effect on a service that is already struggling. Evidence queries should have bounded time ranges and resource limits. Several agents should not independently scan the same large production tables during a database incident. Cached diagnostic results, sampled traces, and a concurrency cap can make the investigation less disruptive.

Logs and tickets are inputs, not instructions with authority. Tool permissions should remain fixed outside the material the agent reads. Sensitive fields should be removed before they enter an investigation when they are not needed. These controls are part of operating the workflow, rather than something a prompt can reliably enforce by itself.

## Review capacity still limits useful output

Suppose a workflow prepares twelve changes per working day, while the team can carefully review four. Under those illustrative assumptions, eight more proposals remain outstanding each day before accounting for closures or rework.

Increasing generation speed would make that queue grow faster. Older proposals also become harder to assess as code and product priorities change. An engineer may spend time rediscovering context that was fresh when the investigation began.

![With twelve proposals arriving and four reviewed per day, eight remain queued under the example's assumptions. Limit new work when review cannot keep up.](figure:factory-review-capacity)

I would limit work in progress per owner and component. A scheduled workflow can pause new investigations when its review queue reaches a threshold, while still attaching new evidence to an active incident. Urgent response should have its own priority and capacity rather than compete blindly with maintenance proposals.

The queue should also allow work to close without code. Duplicate reports, obsolete findings, and investigations with insufficient evidence are normal outcomes. Requiring every job to produce a pull request creates an incentive to manufacture changes.

## Check whether the repeated savings cover the upkeep

A small time model helps make the decision concrete. Suppose a recurring task takes fifteen minutes, and automation reduces the human portion to five. At sixty runs a month, that saves ten hours. If maintaining the workflow takes four hours a month, the recurring saving is six hours before considering failures and the initial build.

At six runs a month, the same assumptions save only one hour while maintenance still takes four. These are illustrative numbers, not a benchmark. They show why repetition matters more than the appeal of a fully automated process.

I would track review time, false alarms, reopened investigations, operating cost, and the age of waiting work. For incidents, I would also track time to useful evidence and the user-facing recovery measures. Some benefits, such as avoiding repeated overnight interruptions, are not captured well by a simple hours calculation, but should still be stated explicitly.

A workflow needs an owner and a removal condition. If the underlying failure disappears, its diagnostic job may no longer deserve a schedule. If the process changes every week, maintaining its instructions can consume the time it was meant to save. Disabling a workflow that no longer helps is a normal part of maintaining it.

## The version I would start with

I would choose one recurring investigation and automate evidence collection first. Then I would compare its output with a few completed investigations, including cases where the apparent cause was wrong or the evidence was incomplete.

If that saves time, the next step would be reproduction and a proposed repair, with bounded tool access and a clear review owner. Only after observing reliable behavior would I consider automatic execution for a small set of established actions.

That is enough to get value without building a general system for every kind of engineering work. As the product and its operational workload grow, more coordination may become worthwhile. The useful stopping point is the amount of automation that reduces repeated work while leaving the team able to understand and direct what happens.
