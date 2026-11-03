title: Checking whether an agent completed the task
date: 2026-09-30
updated: 2026-11-03
about: AI systems
category: Industry & practice
cover: /img/posts/checking-an-agents-results-wide.webp
card: /img/posts/checking-an-agents-results-card.webp
summary: The conversation explains an agent’s actions. Checking the resulting records establishes whether the requested work actually happened.

An agent can describe a completed task without the intended result existing. It might say an address was updated after changing the wrong customer, or report a booking after receiving a response that only acknowledged the request.

Evaluating the task requires checking the state it was meant to change. The conversation helps explain the attempt, but the application records provide evidence of the result. Anthropic makes this distinction between a transcript and an outcome in its guide to [evaluating agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

## Defining what completion means

Take a request to change a customer's billing address. Before running the agent, the evaluation needs to identify the customer, the original address and the requested replacement. It also needs to decide which nearby information should remain unchanged, such as the shipping address and other customers' records.

The result check can then ask concrete questions. Does the intended customer now have the new billing address? Did the operation affect any other account? If the application keeps an audit record, does that record describe the same change?

These checks are more informative than looking for a sentence saying the update succeeded. They also make it possible to distinguish partial completion from failure. An agent that finds the right account but stops before saving it has made progress, although it has not completed the task.

## Checking persistence and retries

A successful tool response can be useful evidence without being the final result. Some applications acknowledge a request before processing it. Others return a temporary result that must still be saved. The evaluation should check the state the user will encounter afterward, through an appropriate read or application view.

For asynchronous work, that may require waiting for a defined completion condition. Waiting indefinitely would hide a failure. Checking immediately could mark a valid pending operation as unsuccessful. A bounded wait with an explicit pending outcome makes the distinction visible.

Retries need their own cases. Suppose the address was saved but the response never reached the agent. A second attempt should not create an unrelated customer or repeat a downstream action unnecessarily. Starting from that intermediate state tests recovery more directly than running only from a clean, uncomplicated account.

## Allowing different valid approaches

There may be several reasonable ways to complete the same task. An agent could locate the customer by email, account number or an exact search result. Requiring one particular sequence of tool calls would reject some valid attempts without improving the result check.

I would keep outcome requirements separate from process restrictions. The address must be correct regardless of the route taken. Accessing an unrelated account or bypassing a required approval could still make the attempt unacceptable, even if the final address is right. Both kinds of checks matter, but they answer different questions.

The transcript becomes especially useful when one of those checks fails. It can show whether the agent misunderstood the request, selected the wrong record, missed an error or continued after the result became uncertain. That gives the failure a more useful explanation than a single score.

## Reading results across runs, not within one

An agent is not deterministic, so a single pass says less than it appears to. The same case can
succeed on one attempt and fail on the next for reasons that have nothing to do with a change
anyone made.

Running each case several times gives a pass rate rather than a single verdict. A change from nine successes in ten runs to six in ten deserves investigation, but ten runs may still be too few to separate a regression from ordinary variation. A single failure identifies a case to investigate; repeated runs help estimate how often it occurs.

Thirty cases repeated five times require 150 agent runs. The appropriate schedule depends on their cost and duration: a small set can run on each change, with broader repeated evaluations before release. Record the sample size with every reported pass rate.

## Cost and duration are outcomes too

Two successful agents can differ substantially in cost and duration. Those differences matter when the task runs repeatedly or someone is waiting for the result.

Token spend, tool-call count and elapsed time are worth recording alongside the result. They
show when a change made the agent correct by making it exhaustive, which tends to surface later
as a cost problem or a latency complaint rather than a correctness one.

Reaching a step limit can indicate a loop, an unusually demanding task or an insufficient budget. Inspect the calls and intermediate results before assigning the cause.

## Making the evaluation repeatable

Each run needs a known starting state. If a previous attempt already changed the address, the next agent might appear successful without doing anything. Resetting the relevant records, or giving each run its own fixtures, keeps the comparison meaningful.

A small set of cases can cover substantially different situations: a unique customer match, two similar names, an invalid address, a lost response and an account the agent cannot edit. Repeating cases can then reveal variation between attempts. One successful run establishes less than consistent success across those conditions.

A compact case record makes these decisions reviewable:

```
Fixture          Customer A has the old billing address
Expected change  Customer A has the requested billing address
Must not change  Shipping address; every other customer
Completion       Persisted result visible within the case's deadline
Result           Pass, fail, or unresolved at the deadline
Run metadata     Model/configuration, tool calls, tokens, elapsed time
```

Tasks such as research summaries also need a rubric for coverage, evidence and relevance. Keep that judgment separate from checks that can inspect records directly.
