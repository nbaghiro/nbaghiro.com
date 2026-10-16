title: One integration, two callers
date: 2026-10-16
about: FlowMaestro
cover: /img/posts/one-integration-two-callers-wide.webp
card: /img/posts/one-integration-two-callers-card.webp
summary: An automation platform has to let a graph call Slack and let a model call Slack, and the obvious way to build that is twice. Making one operation serve both callers turned out to rest on a single schema with three readers.

FlowMaestro runs two kinds of thing. There are workflows, which are graphs a person draws: this trigger, then that step, then post the result to Slack. And there are agents, which are a model with a set of tools, deciding for themselves what to call and with what.

Both of them need Slack. Both need Notion, HubSpot, Postgres and the other hundred and fifty services in the catalogue. The difference is who is holding the pen. In a workflow the parameters were typed into a form weeks ago and the run is the same every time. In an agent the model picks the tool and writes the arguments in the moment, from a description it read.

The obvious way to build that is twice: an integration catalogue for the builder, and a tool catalogue for the agent. I want to describe why that is a trap, what replaced it, and the part of the replacement that still does not sit right.

![A workflow node and a model's tool call arriving at the same operation function, which then calls the service once.](figure:two-callers)

## What building it twice actually costs

The duplication is not the code that makes the HTTP request. That part is small, and copying it would be survivable.

What gets duplicated is everything around it. Each service has an auth story: an API key here, OAuth with a refresh token there, a token that expires in an hour and has to be renewed before a call rather than after a failure. Each has rate limits worth respecting, pagination worth hiding, and errors worth normalising, because `429` from one service and `rate_limit_exceeded` from another should reach the caller as the same kind of problem. Each has a parameter schema that has to be described once for a form and once for a model.

Two of each of those is not twice the work, because they do not stay in step. The fix you make on the workflow side when a customer hits a Slack thread-timestamp edge case does not reach the agent side, and nobody notices until an agent silently posts to the wrong place. The second copy is always the one that rots, because the first one is the one people are using while you are looking.

## The interface asks for both

So a provider in FlowMaestro is one class with both surfaces on it, and the base class makes them mandatory rather than encouraged:

```
abstract executeOperation(op, params, connection, ctx)   // a workflow node
abstract getMCPTools(): MCPTool[]                        // what an agent may call
abstract executeMCPTool(toolName, params, connection)    // an agent calling it
```

There are 156 provider directories in the repository, and all 156 implement all three. That is not discipline, it is the compiler: a provider that only serves the builder does not type-check, so the question "did we expose this one to agents yet?" cannot be asked.

A hundred and fourteen of them keep the agent half in a separate `mcp/` folder and the rest put it inline on the provider class, which is a filing preference rather than a difference in behaviour. The ones that inline it are often the thinnest: AWS S3's `executeMCPTool` strips its prefix and calls `executeOperation` with the mode set to `agent`, which is the whole adapter.

## One definition, three readers

The thing that makes both surfaces cheap is that an operation is described once, in a structure that carries its own schema.

![One operation definition read by three things: the node's form, the engine's validation, and the tool spec given to the model.](figure:one-definition)

Each operation registers an id, a name, a description, a category and a Zod schema for its input. Three different parts of the product read that one record.

The canvas reads it to build the node's form. When you pick Slack and then Send Message, the panel that appears is not hand-written: the router walks the provider's operations, converts each Zod schema to JSON Schema, and flattens it into the parameter list the inspector renders. A new optional field on an operation shows up in the product without anybody opening the frontend.

The engine reads it to validate. The parameters the node collected are parsed against the same schema before the call goes out, so a workflow fails at the step that is wrong rather than inside somebody's HTTP client.

The model reads it as a tool. `getMCPTools()` maps over the same operations and emits a tool per operation, whose `inputSchema` is that Zod schema converted by the same function the canvas path uses. The model is looking at the form, in the only format a model can read.

This is the whole trick, and it is less clever than it sounds. There is no code generation and no registry of mappings. There is one object with a schema on it, and three consumers that each ask it a different question.

## What a provider actually looks like

![The files of one provider, with the operations shared by both callers and a small adapter for the model, beside the counts across the repository.](figure:provider-shape)

Slack is the example I keep going back to because it is unremarkable. A provider class that declares the metadata and registers its operations. A client that owns auth, pooling and retries. One file per operation, which is where the work is. And an adapter of 46 lines that prefixes the operation ids with `slack_`, converts the schemas, and routes a tool call back to the same `executeSendMessage` the node calls.

Across the repository that comes to 1,759 operation files, and one line each in the registry, which holds a lazy loader per provider so that a worker touching Slack does not import the other 155.

The payoff is the thing that does not appear in any diff: when somebody adds a service for a workflow, the agents can use it the same afternoon, and nobody filed a ticket to make that true.

## What it costs

Three things, and the first one is not solved.

**The description is doing two jobs.** A field in a form wants a short label: "Channel". A tool parameter wants a sentence that tells a model when to use the thing and what the value should look like: "The Slack channel id, not the name, in the form C0123ABC". Right now both of those come out of the same `description` string, which means it is either a clumsy form or a thin tool spec. The honest answer is probably a second field written for the model, and I have not added it.

**Strictness cuts both ways.** A person filling a form gets to see the error and try again. A model gets a validation failure as a tool result and will often retry with the same shape, because the schema it was given was correct and its reading of it was not. The same strict parse that makes a workflow fail usefully makes an agent loop, and the handling for that lives above the provider rather than in it.

**Symmetry is not the same as parity.** Every provider exposes tools, but the catalogue still lists 42 entries as coming soon, and shared plumbing does not write those. A single interface flatters the inventory: it tells you every provider has both surfaces, not that every service your customer wants is there.

If you have built the two-caller version of this, I would like to know where you put the seam: one object with two faces, as here, or two thin surfaces over a shared core underneath them both.
