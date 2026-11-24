title: What we check before changing an AI model
date: 2026-10-11
about: Galleo
cover: /img/posts/checking-a-model-change-wide.webp
card: /img/posts/checking-a-model-change-card.webp
summary: Building a product-specific model comparison from fixed tasks, deterministic checks, repeated runs and visual review, with a proposed rollout policy rather than an invented benchmark result.

A new model produces a better-looking presentation in one example. Before using it by default, we still need to know whether it follows editing instructions, preserves unrelated content, chooses valid tools and finishes within an acceptable time and cost.

In Galleo, we have evaluation entry points for agent behavior and content generation. The code includes deterministic checks for issues such as placeholder copy and invalid content structure, alongside model-based judging. Visual checks live separately because the rendering engine belongs to a different layer.

Those pieces provide a starting point for a model-change decision. The following is a proposed evaluation and rollout process built around that tooling.

## Define the change being evaluated

A model rarely runs alone. Its behavior depends on the system prompt, tool schemas, available context, sampling settings, retry policy and application code.

For a first comparison, we would hold those inputs constant and change only the model. That answers a specific question: how does the candidate behave in the existing product setup?

The candidate may benefit from a different prompt or tool description. That is a second experiment. We would record the adapted setup separately, because otherwise a better result could be attributed to the model when the prompt change did most of the work.

Each run needs an identifiable configuration: model identifier, prompt version, tool-schema version, fixture revision, generation settings and application build. Where a provider offers only a moving alias, we would record the available response metadata and acknowledge the resulting reproducibility limit.

## Choose cases from the work people actually do

A presentation product needs more than “make a deck about renewable energy.” We would include creating from a brief, revising one section, changing the format, working with sparse source material and preserving a requested brand style.

Editing cases are especially useful. “Shorten this paragraph without changing the chart” has a clear scope. The final document can be inspected for unintended changes, not just whether the rewritten paragraph sounds good.

We would keep a small curated suite for regular comparisons and a separate set of less familiar cases for release decisions. Continually tuning prompts against the same examples risks making the suite easier without improving general behavior.

Real support cases can help, but they need permission and suitable handling before becoming reusable fixtures. Synthetic or carefully redacted examples are often enough to preserve the failure mode without retaining customer information.

![A model comparison uses the same tasks and inputs for the baseline and candidate. Their outputs are evaluated with structural checks, task outcomes and visual review.](figure:model-comparison)

Cases should also include uncertainty: missing information, an unavailable tool and instructions that should lead to clarification. A system that always produces something can appear successful while making unsupported assumptions.

## Separate checks that answer different questions

A schema check can establish that the output has valid fields and element types. It cannot establish that the content is accurate or useful. A rendered screenshot can reveal overflow but may hide that an unrelated paragraph was changed.

We would report several dimensions separately:

- Structural validity: can the application load and render the result?
- Task completion: did the requested change happen?
- Scope preservation: did unrelated content stay intact?
- Content quality: is the result clear and supported by the input?
- Visual behavior: does the output fit at the required sizes?
- Operational cost: how long did the complete task take, including retries?

Galleo's deterministic checks already include placeholder detection and structural checks. We would keep those distinct from subjective scoring. A model-based judge can help prioritize review, but its score is another model output. Its prompt, version and known biases should be visible.

For subjective comparisons, we would hide which model produced each result and vary the display order. Reviewers can compare both outputs against the same task and reference material. A few written reasons are often more useful than a decimal score without context.

## Inspect tool effects as well as final messages

An agent can say “Done” even when the requested edit failed. It can also produce a correct final message after making an unintended change elsewhere.

The evaluation should inspect the resulting document and the recorded tool operations. For a narrow edit, compare the before and after state outside the permitted area. For an operation requiring confirmation, verify that the agent did not apply it before that confirmation.

Tool arguments need validation in the application regardless of evaluation performance. A successful test suite is evidence about observed behavior, not a replacement for authorization or input validation.

We would run side-effecting cases against fixtures or controlled substitutes. Sending production emails or modifying customer documents merely to compare models would introduce effects the evaluation does not need.

## Repeat runs and keep failures in the denominator

A single run can hide variability. We would repeat important cases for both models and preserve every outcome, including timeouts, invalid tool calls and exhausted retries.

The report should state the number of cases and runs, not only an average score. For a modest suite, raw counts and examples make the uncertainty easier to judge. Small differences should not be presented as a reliable ranking without enough evidence.

Latency should measure the complete user task. A fast first token can coexist with a slow repair loop. Cost should include retries, tool-related model calls and judging costs separately; otherwise an inexpensive first attempt can look better than the workflow it actually produces.

We would define release blockers in advance. For example, an unauthorized effect or repeated corruption of unrelated content may block a change even when the average writing score improves. Aggregate improvement should not conceal a critical regression.

![Structural validity, task completion, scope preservation and operational cost remain separate results. A release decision reviews critical failures rather than relying only on one average score.](figure:model-release-gates)

## Preserve evidence for the decision

For each failed case, keep the input, configuration, resulting artifact, relevant trace and reviewer notes. Access to those records should match the sensitivity of the fixtures.

A useful report lets someone move from a summary count to the actual failure. “Three editing cases changed content outside the requested section” is actionable when those diffs are available. A general quality score does not explain what needs fixing.

We would also separate a model regression from an application regression. If both models fail after a tool-schema change, the shared integration deserves attention before concluding that the candidate is unsuitable.

## Roll out with a way back

After evaluation, a limited rollout can expose cases absent from the suite. We would start with a narrow set of eligible tasks and monitor task failures, repair attempts, latency and user corrections against the previous setup.

The fallback should restore the full earlier configuration, not just a model name. If prompts and tool handling changed together, rolling back only one can create a combination that was never evaluated.

Some tasks may stay on the earlier model while others move. A model that improves initial drafting may still be less reliable at precise edits. Routing should follow observed task performance rather than assume one model is best for every step.

The value of this process is a decision we can explain: which work improved, which failures remained, what the comparison covered and how we would respond if production behaved differently. The evaluation should make those limits visible alongside the gains.
