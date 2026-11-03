title: Terraform and Pulumi across three projects
date: 2026-11-03
updated: 2026-11-03
about: Infrastructure
cover: /img/posts/terraform-and-pulumi-wide.webp
card: /img/posts/terraform-and-pulumi-card.webp
summary: LlamaTrade's infrastructure is Terraform, Clientbridge's and FlowMaestro's are Pulumi. The same invariant appears in two of those codebases, enforced one way and documented the other. What the difference bought, and where Terraform is still the better answer.

Three of my products describe their infrastructure in code. LlamaTrade uses Terraform. Clientbridge and FlowMaestro use Pulumi. Their infrastructure includes Google Cloud deployments, and FlowMaestro also supports Render. LlamaTrade and Clientbridge both pair GKE Autopilot with Cloud SQL, giving the connection-budget example a comparable setting.

These projects were built with their respective tools; none was migrated for this comparison. The useful question is how each repository checks the relationships between cloud resources and application configuration.

## The same invariant, enforced once and documented once

Both LlamaTrade and Clientbridge run their application pods against a single Cloud SQL instance, and both need the instance's `max_connections` to cover every pod's connection pool at its worst moment. Get it wrong and a deploy fails at the point where the new pods and the old pods are both connected.

LlamaTrade states the rule in the description of the Terraform variable that sets the flag:

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

The pool sizes live in a Kubernetes ConfigMap applied by Kustomize. Terraform does not consume that manifest, so its database variable is not currently checked against the deployed pool configuration. Maintaining the relationship requires a shared input or a check that reads both outputs.

Clientbridge computes the same quantity:

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

`DB_POOL_SIZE` and `DB_MAX_OVERFLOW` are the same constants the program uses to render the container's environment variables, so both consume the same pool-size definitions. A test closes the loop:

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

It checks the rendered pod, the arithmetic over every environment, and the flag the instance is actually created with. Raising replica counts far enough to exceed the configured connection budget fails the check.

The advantage here comes from a shared source of configuration and a test over its outputs. Terraform can calculate a budget and assert conditions too. Its separate Kustomize workload layer makes this repository's check less direct, but not impossible: CI could compare the rendered manifests with a machine-readable plan or generate both from shared settings.

## Creating the cluster and its workloads

LlamaTrade's Terraform manages Google Cloud resources. Kubernetes workloads are Kustomize overlays applied separately, with no Kubernetes provider in the Terraform program. That separation lets workload changes follow their own deployment process.

It also avoids a provider initialization problem. [Terraform's provider configuration](https://developer.hashicorp.com/terraform/language/block/provider) requires values available before apply. A Kubernetes operation that needs API access during planning cannot inspect a cluster that has not yet been created. Splitting cluster creation from workload application gives the second stage a known endpoint and credentials.

Clientbridge instead builds a Pulumi Kubernetes provider from its cluster output:

```python
gke = cluster.create(stack.project, stack.region, net, repository)
endpoint = cluster.dns_endpoint(gke)
provider = namespace.provider("gke", endpoint)
compute.create(provider)
```

The endpoint is an `Output[str]`; a transformation builds the kubeconfig, and workloads use the resulting provider. The shared program can express the dependencies between cluster and workloads while keeping their resource definitions in separate modules.

An explicit provider also avoids accidentally targeting the operator's default kubeconfig. Clientbridge's workload factories receive a typed context whose options include the provider and scaffolding dependencies:

```python
def options(self, depends_on=(), timeouts=None) -> pulumi.ResourceOptions:
    return pulumi.ResourceOptions(
        provider=self.provider,
        depends_on=[*self.scaffolding, *depends_on],
        custom_timeouts=timeouts,
    )
```

The convention reduces repeated setup at resource call sites. Tests still need to check that resources use it; a method signature alone does not prevent another module from constructing a resource directly.

## What the tests actually check

Clientbridge's pytest harness builds the cloud and environment stacks against Pulumi mocks, without cloud credentials. It inspects resource registrations and dependencies. These are tests of the generated program, not a deployment or a check that Google Cloud will accept every proposed resource.

A recorder subclasses Pulumi's mock monitor and keeps every resource registration, including the dependency list the engine was given:

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

A fakes class supplies the provider outputs the program reads back, which is how the cluster's DNS endpoint exists during a test. The tests run the real entry point with `runpy.run_path`, and the stack configuration comes from the real `Pulumi.yaml` and `Pulumi.<stack>.yaml` files, skipping encrypted values. The entry point and configuration are shared with deployment, although mocked provider outputs still need to represent the properties the real providers return.

Having the registrations and their edges in a Python list makes some useful properties checkable. That every Google Cloud resource waits for API enablement, as a statement about the graph rather than about any one resource:

```python
apis = {each.urn for each in enabled}
for each in cloud.resources:
    if each.type.startswith("gcp:") and each.type != "gcp:projects/service:Service":
        assert apis <= set(each.dependencies), each.name
```

Other tests check namespace scoping, matching HTTPRoute and DNS records, and deployment-workflow settings such as branch restrictions, concurrency and permissions. These are assertions about specified properties, not a general proof of least privilege.

Terraform also has [native tests](https://developer.hashicorp.com/terraform/language/tests), including mocked providers. Its [JSON plan output](https://developer.hashicorp.com/terraform/cli/commands/show) can be inspected by an external program, so graph and arithmetic checks are not exclusive to Pulumi. In Clientbridge, Python made those checks convenient alongside the existing configuration code. The inspected LlamaTrade Terraform directory has no `.tftest.hcl` files; adding checks would be a smaller change than rewriting it.

## Secrets and the state file

A secret needs protection both in configuration and in saved state. Marking a Terraform value `sensitive` hides it from ordinary display, but should not be treated as removing it from state. [Pulumi's secret handling](https://www.pulumi.com/docs/iac/concepts/secrets/) encrypts marked values and tracks their use through output transformations. Both still require care about what the program creates, logs and exports.

Clientbridge takes a narrower approach: its infrastructure program creates Secret Manager containers and access rules, while a separate script writes secret values through the API. The script imports the same environment and database definitions, keeping secret names and URL formats aligned without passing the values through infrastructure state.

Tests inspect registrations and outputs to check that secret-bearing resource types and values have not entered the infrastructure program. The shared catalogue is also checked against the containers created. This checks the chosen separation of responsibilities; it does not replace access controls and auditing on the value-writing script.

LlamaTrade could adopt a similar separation while remaining on Terraform. The benefit comes from deciding which system owns secret values and testing that boundary, rather than assuming a language makes state safe by itself.

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

These are the repository's pins, not a claim about the latest releases. The generated SDK lets the TypeScript program declare Render resources alongside its application configuration. A platform setting selects Render or GKE, with shared application settings feeding the target-specific resource definitions.

The bridge adds another version boundary to review: the upstream provider, bridge and generated SDK can change independently. An upgrade should inspect changed fields and defaults, preview the target stack and test the resources the project actually uses. Provider counts are less informative for this decision than whether those specific operations work and remain maintained.

FlowMaestro demonstrates provider reuse, but its infrastructure does not have Clientbridge's mock-test suite. Choosing the same tool did not create the same verification coverage.

## Comparing the repository boundaries

The three setups differ in what they put under one program:

- **LlamaTrade:** Terraform owns cloud resources; Kustomize owns workloads. Terraform state uses a Cloud Storage backend. The connection-budget relationship crosses those definitions, and the inspected Terraform directory has no native test files.
- **Clientbridge:** Python Pulumi defines cloud resources and workloads in separate stacks using shared settings. State uses a versioned Cloud Storage backend with a Google Cloud KMS secrets provider. Its tests inspect generated resources and cross-stack configuration assumptions.
- **FlowMaestro:** TypeScript Pulumi targets GKE or Render, including a bridged Render provider. The deployment configuration uses Pulumi Cloud; it has no comparable infrastructure test suite.

The comparison is between these repository designs. Licensing, hosted features and commercial terms need a separate check against the versions and services a team intends to use; they did not determine the connection-budget design described here.

## Preview and policy tradeoffs

Pulumi's general-purpose language also allows resource declarations to depend on code that runs only once an output is known. [Its documentation](https://www.pulumi.com/docs/iac/concepts/inputs-outputs/apply/) recommends avoiding resource creation inside `apply`: when an input is unknown during preview, those resources may be absent from the preview.

Clientbridge uses output transformations for values and declares resources outside those callbacks. That keeps the resource graph more visible before deployment. It remains a convention to review and test as the program changes. Terraform's more constrained configuration model makes some dynamic construction patterns unavailable, which can be useful when predictable plans matter more than language flexibility.

Policy timing also needs a precise comparison. [Pulumi resource validation policies](https://www.pulumi.com/docs/discovery-governance/guides/write-a-policy-pack/) can inspect and block a resource before creation or update. Stack validation examines the completed graph at the end of a preview or update pass; properties unknown during preview remain unknown there. It would be inaccurate to describe all Pulumi policy checks as post-deployment checks.

Terraform's JSON plan can feed policy tooling before apply. In either system, choose a check whose timing matches the invariant: a rule intended to prevent a resource must run before that resource is created, with enough known information to decide it.

A team already operating Terraform modules, reviews and state workflows has another reason to keep it. Migration means preserving resource identity, replacing code and rechecking plans, not just translating syntax. The connection-budget check alone would not justify that disruption for LlamaTrade.

## What I would keep

Clientbridge's self-managed state keeps the deployment path and encryption key within its Google Cloud setup. That also makes backend access, backups and recovery an operational responsibility. A mock-test suite cannot establish that a damaged or inaccessible state backend can be recovered; that needs its own procedure and exercise.

For Clientbridge, shared configuration and resource inspection made the pool-budget test straightforward. For LlamaTrade, I would start by checking the Terraform plan against the rendered Kustomize workloads and adding native tests for cloud-only assumptions. For FlowMaestro, the useful next step is coverage of the generated resources for each target platform.

The choice I would repeat is to identify the invariant first, then choose where its inputs live and how it will be checked. Pulumi made that convenient in Clientbridge. The same requirement can be addressed in Terraform without migrating an otherwise suitable deployment setup.
