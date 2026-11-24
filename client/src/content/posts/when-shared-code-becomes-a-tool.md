title: When shared code should become a separate tool
date: 2026-11-05
about: Engineering
cover: /img/posts/when-shared-code-becomes-a-tool-wide.webp
card: /img/posts/when-shared-code-becomes-a-tool-card.webp
summary: Deciding what to extract from repeated product code, with a proposed plan-and-apply tool boundary, explicit product policy, compatibility tests and a maintenance plan.

Several products need similar setup work: read a catalog, compare it with a remote system, create missing objects and report the result. Copying the first implementation can be useful. Later, a fix may need to be made in several repositories.

That is the point where we would consider a shared tool. The decision depends on whether the behavior is sufficiently stable and whether maintaining the shared contract will reduce work overall.

Galleo already has a setup script that reads its billing catalog and supports dry-run and drift-check modes. Clientbridge has its own setup script with product-specific requirements. These are concrete examples of repeated work, not evidence that one finished package already serves both products. The boundary below is a proposed extraction approach.

## Compare behavior before comparing code

Two functions can look similar while implementing different policies. Both may create a price, but differ in which existing objects they own, whether an old item should be archived and what a catalog change means for current customers.

We would start with a behavior table across the consumers. Which inputs identify an object? Which changes are safe to apply automatically? Which require a migration or review? What happens after a timeout? What must a second run do?

The common part may be smaller than the duplicated files suggest. For example, matching owned objects by stable identity, computing a difference and reporting operations can be shared. Choosing plan limits, grace periods or customer migration policy may remain in the product.

That distinction prevents the shared tool from accumulating product names in conditionals. If the tool needs to know which product it is serving to make routine business decisions, the boundary may be carrying too much policy.

![Product policy supplies a catalog and approved rules. A shared core computes and applies a plan through an adapter, then returns structured outcomes to each product.](figure:shared-tool-boundary)

## Give the tool a small explicit input

A reusable input should describe the desired state and the resources the tool is allowed to manage. It should not quietly read unrelated application settings or infer its scope from display names.

For the example, we would pass a catalog version, an ownership namespace, desired objects and a target environment identity. The tool validates that input before reading or writing remote state.

```text
input:
  catalog_version
  managed_namespace
  target_environment
  desired_objects

output:
  observed_revision
  operations
  warnings
  unresolved_changes
```

These fields are illustrative. They make the important questions visible: which objects belong to this tool, which system it will affect and which changes it cannot safely decide alone.

Secrets should be supplied through the execution environment or an explicit credential interface, not serialized into the plan. Logs and fixtures should contain references and redacted diagnostics rather than reusable credentials.

## Separate planning from applying

A planning function can compare desired and observed state and produce explicit operations. An apply layer executes those operations and records outcomes.

That separation makes the behavior easier to review and test. A dry run should use the same comparison as an apply run, so the preview is evidence of the intended work rather than a different approximation.

A plan is also time-sensitive. Remote state can change after it is generated. Before applying, the tool should revalidate relevant preconditions or recompute the affected operations. Where the provider offers conditional writes, the adapter can use them. Otherwise the tool needs a policy for conflicts and ambiguous outcomes.

We would avoid implying that an approved plan authorizes arbitrary future changes. Its target, ownership scope and significant operations should remain bound to what was reviewed. A changed target environment or a newly destructive operation should produce a new plan.

## Keep provider behavior in an adapter

The shared comparison logic should not need to know how a provider paginates results or reports a missing object. An adapter can normalize those details while preserving distinctions the core needs.

For example, not found, temporarily unavailable and access denied are different outcomes. Converting all three into an empty list could make the planner attempt to recreate resources that already exist.

Pagination must be complete before the tool treats an object as absent. A failed second page cannot justify deleting or replacing items missing from the partial response. The observed state should carry a completeness result that the planner can require.

Retries belong near the operation whose semantics they understand. A transport retry is safe only when repeating the request is safe or the original result can be recovered. The core should receive an explicit unknown outcome when the adapter cannot establish whether the remote write succeeded.

## Preserve identity across repeated runs

A setup tool is often rerun after interruption. It should find resources created by a prior attempt using stable identities, rather than create duplicates because their names changed.

We would keep the logical operation separate from its individual attempts. If an apply run creates three objects and fails on the fourth, the next run should observe the first three and continue from current state. It should not assume the whole previous run failed.

Deletion and archiving need stricter ownership checks. An object absent from the desired catalog may have been created by a person or another application. The tool should act only within its managed scope and report ambiguous ownership for review.

This is also where product policy returns. Removing a catalog entry may mean stop offering it to new users, retain it for existing users or begin an explicit migration. A generic tool should not choose among those outcomes without a supplied rule.

## Test the contract with more than one consumer

A shared package that passes its own unit tests can still break a product. We would keep representative consumer fixtures and run them against each candidate release.

The fixtures should cover a fresh target, an unchanged target, a partial prior run, an unexpected remote edit and an unsupported change. The expected result includes the plan and the errors, not only whether the command exits successfully.

We would also test the adapter against a controlled environment to verify that its normalized behavior matches the provider. Pure fixtures can establish planning logic, but they cannot prove that pagination, error mapping or remote idempotency behaves as assumed.

![A candidate tool release runs its core tests, adapter checks and fixtures from each consumer before adoption. Products can upgrade independently under a versioned contract.](figure:shared-tool-release)

## Version the behavior people depend on

The public contract includes more than function arguments. Exit codes, structured output, ownership rules and whether a dry run writes anything all matter to callers.

Semantic Versioning describes version changes in relation to a declared public API. That makes defining the API a prerequisite, not something the version number supplies by itself. [Semantic Versioning specification](https://github.com/semver/semver/blob/master/semver.md)

We would pin consumer versions and document migrations when behavior changes. A new default that archives resources previously left alone can be breaking even if the command syntax stays identical.

An older package may still need to read plans or state created by a newer one, depending on the rollback policy. If that compatibility is not supported, the release notes and tooling should make the limit explicit instead of failing midway through an apply run.

## Account for the maintenance work

Extraction creates a new release process, documentation surface and responsibility for consumer compatibility. Someone needs to triage issues, update adapters and decide when old versions stop being supported.

We would begin with a narrow internal package or command used by two real consumers. That gives the abstraction a second set of constraints without immediately committing to a public service, hosted control plane or broad configuration language.

After adoption, useful evidence includes how often fixes reach both products without separate patches, how much product-specific code remains and whether upgrades are straightforward. Lines removed are less informative if the replacement introduces a difficult release process.

The reason to extract is a stable piece of behavior that several products can share with fewer mistakes and less repeated work. Keeping policy explicit, plans reviewable and consumer tests close to releases makes that benefit easier to preserve.
