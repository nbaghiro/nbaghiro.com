title: Sharing integrations between workflows and agents
date: 2026-10-16
about: FlowMaestro
cover: /img/posts/one-integration-two-callers-wide.webp
card: /img/posts/one-integration-two-callers-card.webp
summary: FlowMaestro lets workflow steps and agent tools share provider operations. The shared schemas reduce duplication, but validation, routing and descriptions still need attention in both paths.

FlowMaestro has workflows built from steps and agents that choose tools while they run. Both need to call external services. A workflow might send a Slack message after processing a record; an agent might choose that operation in response to a request.

The provider system gives both callers access to shared operation implementations. The aim is to keep service-specific behavior in one place while allowing the workflow builder and the agent to present it differently.

![A workflow step and an agent tool call reach a shared provider operation. Each caller has its own adapter.](figure:two-callers)

## What the provider owns

An integration includes more than the HTTP request. It has connection handling, input definitions, operation routing and a way to return results or errors. Maintaining separate implementations for workflows and agents would create more places for those behaviors to diverge.

FlowMaestro's base provider requires three methods: one to execute a workflow operation, one to describe agent tools, and one to execute an agent tool call.

```
executeOperation(operation, params, connection, context)
getMCPTools()
executeMCPTool(toolName, params, connection)
```

That interface makes both entry points part of the provider contract. It does not prove that every registered operation is correctly routed, validated or equally capable through both paths. Those properties still depend on the implementation and tests.

## A schema used in several places

Operations register an identifier, name, description, category and Zod input schema. The same record supplies information to the builder, validation code and agent tool description.

![An operation definition supplies the builder's parameter information, runtime validation and the agent's tool schema.](figure:one-definition)

The execution router converts the operation's input schema to JSON Schema and extracts parameter information for the frontend. This reduces the need to maintain a separate form definition for every operation. The frontend still has to support the field types and interactions that schema requires.

The provider's validation helper parses parameters against the Zod schema. The Slack workflow path calls it before invoking the operation.

The Slack tool adapter also reads the registered operations. It prefixes each identifier with `slack_`, uses the operation description, and converts the input schema into the tool's `inputSchema`. The model therefore receives a description derived from the same operation definition used by the builder.

Sharing a schema reduces drift between those descriptions. It is not a substitute for validating input at execution time.

## Following a Slack call

For a workflow step, `SlackProvider.executeOperation` validates the input, gets a client for the connection, and dispatches to an executor such as `executeSendMessage`.

For an agent call, `executeMCPTool` gets the client and passes the request to `SlackMCPAdapter`. The adapter removes the tool-name prefix and dispatches to the same executor. The provider then converts the result into the value or error expected by the tool caller.

The two entry points also have different validation and error-handling code. A tool schema describes accepted input to the model; it does not enforce that input at runtime. Each execution path still needs validation before it relies on the parameters. Sharing the executor alone is not evidence that the entry points enforce identical checks.

The routing is explicit too. The adapter builds tool descriptions from the registered operations, but dispatches calls through a switch. Adding an operation to the registry does not automatically add its execution branch. Keeping those two lists aligned is part of maintaining the provider.

## What sharing improves

Both paths can reuse the same service client and operation implementation. A fix inside that shared executor can benefit workflow and agent calls without being copied into a second integration.

The provider registry also loads providers on demand. A caller can resolve the provider it needs through the registry instead of directly importing every integration into the calling code.

These are useful boundaries because they keep service behavior together. They do not remove the need for caller-specific handling: a workflow receives a structured operation result, while a tool caller may need a value or an exception it can act on.

## What still needs separate judgment

Descriptions serve different readers. A form label needs to be easy to scan; a model may need examples, accepted identifiers and guidance about when to call the operation. Reusing a description is a useful starting point, but the code should allow a more specific explanation where the caller needs one.

Error handling also differs. A person can correct a field in the builder. An agent needs enough information to decide whether to change its arguments, retry later or stop. Sharing the service executor does not determine that policy.

Finally, provider counts are not a measure of complete integration coverage. A provider can expose both interfaces while individual operations, schema handling or routing still need work. Reviewing a real call end to end is more informative than counting directories.

The shared operation is the part of this design I would retain. It keeps service-specific work together while leaving the callers free to use it differently. The follow-up is to make their validation and routing guarantees equally explicit.
