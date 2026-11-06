title: Terraform and Pulumi across three projects
date: 2026-11-03
updated: 2026-11-06
about: Infrastructure
cover: /img/posts/terraform-and-pulumi-wide.webp
card: /img/posts/terraform-and-pulumi-card.webp
summary: A technical comparison of Terraform and Pulumi in three projects: database connection calculations, tests across configuration layers, preview limitations, secrets in state, and resource changes.

I use Terraform for [LlamaTrade](https://llamatrade.ai) and Pulumi for [Clientbridge](https://clientbridge.ca) and [FlowMaestro](https://flowmaestro.ai). Both tools let me describe cloud resources in code, review changes before applying them, and keep track of the resources they manage. The projects use Google Cloud for infrastructure such as Kubernetes clusters, databases, networking, and access permissions.

Each project was built with its current tool. This is a comparison of those setups, rather than a migration story. I’ll start with a requirement shared by LlamaTrade and Clientbridge: their applications need to stay within the connection limit of a Cloud SQL database. That example helps explain how configuration and tests fit together in each repository.

## Checking that the database has enough connections

Both LlamaTrade and Clientbridge run application pods on GKE Autopilot and connect them to a single Cloud SQL instance. Each application process can open a pool of database connections. Together, those pools need to fit within the database’s `max_connections` limit, with room left for administration and other services.

The busiest point can be during a deployment, when old and new pods are running at the same time. Counting only the connections used during normal operation can miss that overlap. If the total exceeds the limit, some processes may be unable to connect. I use ‘connection budget’ below to mean this estimate of the connections the system may need.

In LlamaTrade, the Terraform variable documents what the limit needs to cover. This excerpt shortens the description; the full variable also explains the database-tier defaults:

```hcl
variable "db_max_connections" {
  description = <<-EOT
    Postgres max_connections for the Cloud SQL instance. Must cover the sum of
    every pod's (DB_POOL_SIZE + DB_MAX_OVERFLOW) at HPA maxima plus a reserve for
    admin and monitoring sessions; see the budget in
    infrastructure/k8s/base/configmap.yaml (worst case ~400).
  EOT
  type    = number
  default = null
}
```

The application’s pool sizes are defined separately in a Kubernetes ConfigMap, which Kustomize applies. Terraform does not read that file, so this setup does not automatically compare the database limit with the pool settings. To check the relationship, I would need either shared configuration or a test that reads both sets of values.

Clientbridge calculates the peak connection count in Python. It considers both the deployment overlap and the migration job that runs before the rollout:

```python
def peak_connections(env: Environment) -> int:
    per_process = DB_POOL_SIZE + DB_MAX_OVERFLOW
    api = (env.api.replicas + 1) * API_WORKERS * per_process
    worker = env.worker.replicas * per_process
    auth = (env.auth.replicas + 1) * AUTH_MAX_CONNS
    steady_api = env.api.replicas * API_WORKERS * per_process
    steady_auth = env.auth.replicas * AUTH_MAX_CONNS
    rollout = api + worker + auth + POWERSYNC_CONNECTIONS
    # the migrate Job runs before the rollout, beside the old pods
    migrating = (
        steady_api + worker + steady_auth
        + POWERSYNC_CONNECTIONS + MIGRATE_CONNECTIONS
    )
    return max(rollout, migrating)
```

The API portion is worth working through. Production currently has two API replicas, two worker processes per replica, a pool size of three, and one overflow connection per process. In normal operation that is `2 × 2 × (3 + 1) = 16` possible API connections. The calculation allows one extra pod during rollout, giving `3 × 2 × 4 = 24`. It then adds the background worker, authentication service, and PowerSync allowances. Staging shares the database instance, so its estimate must also be included.

The `max(rollout, migrating)` assumes the migration job completes before the application rollout begins. Adding both totals would overcount those two phases under that deployment sequence. Taking the larger one would undercount if the sequence changed and the jobs could overlap. The replica counts, process counts, rollout strategy, and job ordering are all inputs to the model, even when some are expressed as constants or conventions.

There is another limit to the calculation. Clientbridge sets `maxSurge=1` and `maxUnavailable=0` for these rolling deployments, but [Kubernetes documents that terminating pods can temporarily push the total above replicas plus maxSurge](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/). A terminating process may still hold connections while it drains. The current calculation is therefore a configured rollout estimate, not a strict upper bound on every live connection. I would use connection metrics and a rollout exercise to check the drain assumptions, then add an explicit allowance if needed. Raising `max_connections` also needs to be assessed against database resources; a larger setting does not create more database capacity.

The calculation uses the same `DB_POOL_SIZE` and `DB_MAX_OVERFLOW` constants that supply the containers’ environment variables. A test then checks the generated resources and the total across environments:

```python
def test_the_connection_pools_fit_the_instance(
    cloud: Built, stacks: dict[str, Built]
) -> None:
    for built in stacks.values():
        (api,) = containers(named(built, "kubernetes:apps/v1:Deployment", "api"))
        assert env_vars(api)["DB_POOL_SIZE"] == "3"
        assert env_vars(api)["DB_MAX_OVERFLOW"] == "1"
    envs = environments.build("clientbridge.ca", "staging.clientbridge.ca")
    peak = sum(settings.peak_connections(env) for env in envs)
    compaction = settings.COMPACT_CONNECTIONS
    assert peak + compaction + database.RESERVED_CONNECTIONS <= database.MAX_CONNECTIONS
    (instance,) = of_type(cloud, "gcp:sql/databaseInstance:DatabaseInstance")
    flags = listed(dig(instance.inputs, "settings", "databaseFlags"))
    assert {"name": "max_connections", "value": str(database.MAX_CONNECTIONS)} in flags
```

The test checks three things: the pool settings given to the application, the total connection estimate across environments, and the database flag in the generated resource definition. If a change raises the estimate above the configured limit, the test fails before deployment. Passing means that this model fits the limit; it does not verify that the model includes every process that can connect.

Shared configuration makes this check easier to maintain in Clientbridge. Terraform can also calculate a budget and check conditions. In LlamaTrade, the extra work is reading values from the separate Kustomize setup. CI could compare the rendered Kubernetes files with Terraform’s JSON plan, or both could use shared settings. The requirement can be checked with either tool.

## Checking a requirement across Terraform and Kustomize

For LlamaTrade, I would add a CI check that reads the output of both tools. This is a proposed improvement, not a check the repository already runs.

The inputs would be a saved Terraform plan converted with `terraform show -json` and the Kubernetes files rendered for the intended environment with Kustomize. The checker would find the planned Cloud SQL limit, then calculate the application side from the rendered Deployments, Jobs, and autoscaling settings. It needs to use each service’s effective environment variables, including overrides, rather than multiply the global ConfigMap defaults by a pod count.

That distinction matters here. The reviewed configuration gives the trading service a pool plus overflow allowance of ten connections and an HPA maximum of ten pods: 100 connections before any rollout allowance. The global default is only five per process. Using that default for trading would undercount it by half under the current one-process-per-pod assumption. Changing the process model would require changing this calculation too.

I would make the checker report the contribution from each service and fail clearly when an input cannot be resolved. An unknown value in a Terraform plan is not zero. Likewise, a null `db_max_connections` means this configuration leaves the database-tier default in place; it does not supply a numeric limit the checker can safely compare. The check needs an explicit limit or a deliberately verified source for that default. [Terraform’s JSON format](https://developer.hashicorp.com/terraform/internals/json-format) represents planned values and unknown values separately.

Keeping the cloud and workload configurations separate allows independent deployment and review. The cost is maintaining this connection between them. Shared Python configuration makes the Clientbridge calculation simpler, but it also means a shared constant can change several generated resources at once. In either setup, the review should show which resources and assumptions a change affects.

## Creating the cluster and its workloads

LlamaTrade uses Terraform to create Google Cloud resources and Kustomize to configure the applications running on Kubernetes. The Terraform program has no Kubernetes provider. Application deployments can therefore follow a separate process from changes to the cloud resources.

This also helps when setting up a new cluster. [Terraform's provider configuration](https://developer.hashicorp.com/terraform/language/block/provider) requires values available before apply. If a Kubernetes operation needs to contact the cluster during planning, the cluster must already exist. Splitting cluster creation from workload application gives the second stage a known endpoint and credentials.

Clientbridge instead builds a Pulumi Kubernetes provider from its cluster output:

```python
gke = cluster.create(stack.project, stack.region, net, repository)
endpoint = cluster.dns_endpoint(gke)
provider = namespace.provider("gke", endpoint)
compute.create(provider)
```

The endpoint is an `Output[str]`, a Pulumi value that may become known only when the cluster is created. The program uses it to build the Kubernetes connection configuration, then gives that provider to the application resources. This lets the program describe their dependencies while keeping cluster and application definitions in separate modules.

Passing the provider explicitly also helps ensure resources go to the intended cluster, rather than the one selected in a developer’s local Kubernetes configuration. Clientbridge passes that provider, along with dependencies such as the namespace, through a shared context:

```python
def options(self, depends_on=(), timeouts=None) -> pulumi.ResourceOptions:
    return pulumi.ResourceOptions(
        provider=self.provider,
        depends_on=[*self.scaffolding, *depends_on],
        custom_timeouts=timeouts,
    )
```

This reduces repeated configuration. Tests still need to check that resources use these options, because another module could create a resource without going through the shared context.

## What the infrastructure tests can check

Clientbridge’s pytest tests run the infrastructure code with Pulumi mocks, which stand in for the cloud providers. No cloud credentials are needed. The tests inspect the resources the program asks Pulumi to create and the dependencies between them. They can catch mistakes in the generated configuration, but they do not establish that a real deployment will succeed.

A small recorder extends Pulumi’s mock monitor and saves each resource registration, including its inputs and dependencies:

```python
class Recorder(mocks.MockMonitor):
    def RegisterResource(self, request):
        response = super().RegisterResource(request)
        self.registered.append(
            Registered(
                type=request.type,
                name=request.name,
                urn=response.urn,
                inputs=json_format.MessageToDict(request.object),
                dependencies=list(request.dependencies),
            )
        )
        return response
```

The test setup supplies example provider outputs, such as the cluster’s DNS endpoint. It runs the real program entry point with `runpy.run_path` and reads the project’s `Pulumi.yaml` and `Pulumi.<stack>.yaml` configuration, skipping encrypted values. This keeps the tests close to the deployment code. The example outputs still need to match the structure returned by the real providers.

With those records available as Python objects, a test can check a rule across many resources. For example, this checks that Google Cloud resources depend on the required API-enablement resources:

```python
apis = {each.urn for each in enabled}
for each in cloud.resources:
    if each.type.startswith("gcp:") and each.type != "gcp:projects/service:Service":
        assert apis <= set(each.dependencies), each.name
```

Other tests check that resources use the intended namespace, that HTTPRoute and DNS records agree, and that deployment workflows have the expected branch restrictions, concurrency settings, and permissions. Each test covers a specific requirement. Permission checks like these do not establish that every permission in the system is necessary or sufficient.

Terraform also has [native tests](https://developer.hashicorp.com/terraform/language/tests), including mocked providers. Its [JSON plan output](https://developer.hashicorp.com/terraform/cli/commands/show) can be inspected by an external program, so checks on resource relationships and calculated values can be written for Terraform too. In Clientbridge, Python made those checks convenient alongside the existing configuration code. In the version reviewed for this article, LlamaTrade’s Terraform directory has no `.tftest.hcl` files. Adding tests would be a smaller change than moving it to another tool.

### Separating configuration tests from deployment checks

The API-enablement assertion above verifies that the dependency edges were declared. It does not prove that an API becomes usable immediately after enablement, that the deploying identity has sufficient permissions, or that a provider handles a transient error correctly. Those require checks against the real service.

A useful test setup should also make missing mock behavior visible. If every unknown provider field is replaced with a convenient placeholder, a test can keep passing after the real provider’s output shape has changed. I would keep mock outputs small, review them when provider versions change, and make unexpected resource types or required fields fail explicitly. This is a recommendation for strengthening the harness, not a claim that all those failures are already enforced.

I would use three levels of evidence: tests over generated resources for configuration rules, a provider-backed plan or preview for proposed changes, and deployment checks for actual behavior. For example, a namespace assertion belongs in the first level; an unexpected database replacement belongs in plan review; and a pod’s ability to connect with its real database role belongs in a deployment check. Each catches failures the others can miss.

## Secrets and the state file

Infrastructure state records the resources a tool manages and their known properties. Secret values can end up in that record, so their handling needs to be considered separately from whether they are visible in terminal output. Marking a Terraform value `sensitive` hides it from ordinary display, but should not be treated as removing it from state. [Pulumi's secret handling](https://www.pulumi.com/docs/iac/concepts/secrets/) encrypts marked values and tracks their use through output transformations. Both still require care about what the program creates, logs and exports.

Terraform also supports [ephemeral values and write-only resource arguments](https://developer.hashicorp.com/terraform/language/manage-sensitive-data) that can avoid storing supported values in plans and state. These depend on the Terraform version, the provider, and the particular resource argument. Adding `sensitive = true` to an ordinary input does not give it those properties. I would check the specific resource schema before choosing how to pass a password.

Encryption and omission solve different problems. An encrypted value remains part of the state and needs the right decryption access. A value omitted from state must be supplied or managed elsewhere. Neither approach makes it safe to print a resolved secret into logs or write it into an unprotected generated file. Terraform JSON plans and other review artifacts also need care because machine-readable output can include sensitive data.

In Clientbridge, the infrastructure program creates the Secret Manager entries and access rules. A separate script writes the secret values through the API. The script uses the same environment and database definitions, so names and connection URL formats stay consistent without passing the secret values through infrastructure state.

Tests inspect the generated resources and outputs for secret-bearing types and values. They also check that the shared list of secrets matches the entries created. The script that writes the values still needs its own access controls and auditing. These tests catch marked secret values and selected resource types; they cannot recognize every arbitrary string that someone might accidentally hard-code as a credential.

This separation also adds operational work. Creating a Secret Manager entry does not mean it has a usable version. Initialization needs to happen before a workload depends on the value, and rotation needs to account for when that workload reloads it. Recovery must cover the values and their access permissions as well as infrastructure state. Keeping values out of state reduces one place they are stored; it does not remove their lifecycle.

LlamaTrade could use the same approach with Terraform. What matters here is deciding where secret values are written and stored, then checking that the code follows that decision.

## Using a Terraform provider from Pulumi

FlowMaestro uses Pulumi's provider bridge for Render. Its checked-in project configuration declares the upstream provider and generates a local SDK:

```yaml
packages:
  render:
    source: pulumi/pulumi/terraform-provider
    version: 1.4.0
    parameters:
      - render-oss/render
      - 1.8.0
```

These are the versions pinned in the repository reviewed for this article. The generated SDK lets the TypeScript program declare Render resources alongside its application configuration. A platform setting selects Render or GKE, with shared application settings feeding the target-specific resource definitions.

An upgrade needs to consider the Terraform provider, the bridge, and the generated SDK. Changes in any of them may affect available fields or defaults. I would review those changes, preview the target stack, and test the resource operations FlowMaestro uses. Support for those operations matters more to this project than the total number of providers available.

FlowMaestro shows how an existing Terraform provider can be used from a Pulumi program. Its infrastructure does not currently have a mock-test suite comparable to Clientbridge’s, so the two projects have different levels of automated checking.

## What each project manages together

These are the main differences between the repository setups reviewed here:

- **LlamaTrade:** Terraform owns cloud resources; Kustomize owns workloads. Terraform state uses a Cloud Storage backend. Checking database capacity requires values from both sets of definitions. The reviewed Terraform directory has no native test files.
- **Clientbridge:** Python Pulumi defines cloud resources and workloads in separate stacks using shared settings. State uses a versioned Cloud Storage backend with a Google Cloud KMS secrets provider. Its tests inspect generated resources and check settings shared across stacks.
- **FlowMaestro:** TypeScript Pulumi targets GKE or Render, including a bridged Render provider. The deployment configuration uses Pulumi Cloud; it has no comparable infrastructure test suite.

This article focuses on configuration, tests, and deployment behavior in these projects. Licensing, hosted features, and commercial terms are separate parts of a tool choice and should be checked for the versions and services being considered.

## Knowing what a preview or policy can catch

Pulumi lets application code determine which resources to create. That flexibility needs care when some values are not known until deployment. [Its documentation](https://www.pulumi.com/docs/iac/concepts/inputs-outputs/apply/) recommends avoiding resource creation inside `apply`: when an input is unknown during preview, those resources may be absent from the preview.

For example, these simplified Pulumi Python snippets have different preview behavior. Here the callback creates the resource:

```python
endpoint.apply(
    lambda host: k8s.core.v1.ConfigMap(
        "service-config",
        data={"API_URL": f"https://{host}"},
        opts=pulumi.ResourceOptions(provider=provider),
    )
)
```

If `endpoint` is unknown, the callback does not run during preview, so this ConfigMap may not be registered there. A more predictable form declares the resource immediately and lets only its data depend on the output:

```python
k8s.core.v1.ConfigMap(
    "service-config",
    data=endpoint.apply(lambda host: {"API_URL": f"https://{host}"}),
    opts=pulumi.ResourceOptions(provider=provider),
)
```

Now the resource is visible to the program even if its final data is unknown. That improves review, but it does not make the unknown value available to a policy that needs to inspect the URL. These are illustrative patterns, not extracts from Clientbridge’s configuration.

Clientbridge uses output transformations for values and declares resources outside those callbacks. That helps keep resource definitions visible during preview. It is a practice to maintain as the code changes. Terraform limits some forms of dynamic resource creation, which can make the configuration easier to reason about before applying it.

For policy checks, I would look at when the check runs and what information it has. [Pulumi resource validation policies](https://www.pulumi.com/docs/discovery-governance/guides/write-a-policy-pack/) can inspect and block a resource before creation or update. Stack validation examines the completed graph at the end of a preview or update pass; properties unknown during preview remain unknown there. A resource-level rule and a check over the whole stack can therefore run at different points.

Terraform's JSON plan can feed policy tooling before apply. In either system, a rule meant to prevent a resource from being created needs to run before creation and have enough information to decide whether to allow it.

An existing Terraform setup also has value in the modules, reviews, and deployment procedures the team already understands. Moving tools requires keeping track of existing resources correctly, replacing the code, and checking the resulting plans. For LlamaTrade, adding the connection-budget check would not by itself justify that work.

## Reviewing replacements and changes outside the code

A valid configuration can still propose a disruptive operation. Before applying a change, I would check whether it updates an existing resource, replaces it, or removes it. A rename or a move between modules can affect resource identity even when the intended cloud object is the same. Terraform has moved blocks, and Pulumi has aliases, for describing supported identity changes; neither should be treated as a general guarantee that a refactor is harmless. The resulting plan still needs review. See [Terraform’s refactoring guidance](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring) and [Pulumi’s aliases](https://www.pulumi.com/docs/iac/concepts/resources/options/aliases/).

The live environment can also change without a code change. A manually edited setting or a permission removed elsewhere may invalidate an assumption that passed in a mock test. I would review a refreshed plan or preview when investigating that drift, rather than assume the saved state is a complete description of the current system. The safe response depends on whether the manual change was intentional and whether the code should adopt or reverse it.

Separating application deployments from cloud updates can keep routine releases smaller. Managing related resources together can make dependencies easier to express. Neither organization prevents an accidental database replacement or an access change with a wider effect than expected. Review of the actual proposed operations remains necessary.

## What I would do next in each project

Clientbridge keeps its state storage and encryption key in Google Cloud. That means I also need to manage access, backups, and recovery. The mock tests do not check whether a damaged or inaccessible state backend can be recovered; recovery needs a separate procedure that is tested in practice.

In Clientbridge, I would keep the shared configuration and resource tests, and continue checking them against real deployment behavior. In LlamaTrade, I would add checks between the Terraform plan and rendered Kustomize files, along with native tests for requirements contained within Terraform. In FlowMaestro, I would start testing the resources generated for each target platform.

The main lesson for me is to start with a requirement the infrastructure must meet, identify the settings it depends on, and write a check that uses those settings. Pulumi made that convenient in Clientbridge because the configuration and tests fit naturally into Python. Terraform remains a suitable choice for LlamaTrade, with room to improve how its separate configuration files are checked together.
