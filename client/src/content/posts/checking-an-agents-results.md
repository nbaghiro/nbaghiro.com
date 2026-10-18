title: Checking whether an agent completed the task
date: 2026-09-30
about: AI systems
category: Industry & practice
cover: /img/posts/checking-an-agents-results-wide.webp
card: /img/posts/checking-an-agents-results-card.webp
summary: The conversation explains an agent’s actions. Checking the resulting records establishes whether the requested work actually happened.

An agent saying it completed a task is one thing a test can inspect. The resulting state of the system needs checking as well.

[Anthropic’s guide to agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) uses a booking example: the conversation can say a flight was booked, while the outcome is whether a reservation actually exists in the database.

## Checking the outcome

For a business workflow, the same idea extends to the details. Was the right record changed? Was the amount correct? Did a retry create a duplicate? Did anything outside the request change?

I would define those checks before choosing how to score the conversation. The transcript is useful for understanding the steps taken, including mistakes the agent recovered from. The final records establish whether the requested work happened.

There will still be tasks that need human judgment, such as assessing a research summary. For actions with a concrete result, checking that result should be part of the evaluation from the start.

## Define completion before the run

Suppose an assistant is asked to change a delivery address. A useful check identifies the expected record and the expected new address before the run. It can then inspect the result directly. A pleasant confirmation message is not a substitute for that comparison.

The same test should inspect relevant side effects. A correct address on the wrong order is a failure. An unrelated order changed at the same time is also a failure. These checks turn a broad instruction into observable conditions without requiring the agent to follow one exact sequence of steps.

## Keep the explanation and the outcome

The transcript still matters. It can show whether the agent misunderstood the request, called a tool with the wrong arguments or recovered from an error. Those details help explain a failure and can reveal fragile behavior even when the final result is correct.

A useful evaluation keeps both views: what happened in the system, and how the agent got there. Where the result involves judgment, such as the quality of a research summary, that judgment also needs an explicit standard rather than being left to the agent’s own assessment.
