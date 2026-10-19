title: Code execution in containers
date: 2026-10-19
about: FlowMaestro
cover: /img/posts/code-execution-in-containers-wide.webp
card: /img/posts/code-execution-in-containers-card.webp
summary: How FlowMaestro runs workflow and agent code through shared Docker primitives, including input wrappers, result parsing, resource limits, session reuse and the cleanup behavior that still needs closer testing.

FlowMaestro supports code steps in workflows and a code tool for agents. Both can run Python, JavaScript or shell code. They share the container implementation, but they reach it through different handlers with different validation, defaults and lifecycle behavior.

That distinction is useful when explaining the design. Sharing execution code keeps the Docker configuration in one place. It does not make every caller behave identically, and the configuration alone does not establish that arbitrary code is safe to run.

This article follows the current implementation from a request to a result, then looks at resource limits and container reuse. The examples are small enough to show the data passing through each stage.

## Two entry points into the sandbox

A workflow code node validates its configuration, selects input variables from the workflow context and creates a container. If no input variable names are supplied, it copies the whole context into the input object. After execution, it returns the parsed output and metadata, or raises a code-execution error for a nonzero exit status. Its finally block requests container removal.

The agent tool validates its own input, sanitizes the code and runs a blocked-pattern check. If that check rejects the submission, the tool returns `SECURITY_BLOCKED` before calling the execution activity. The workflow node does not run this analysis.

The agent activity supports additional operations: loading workspace files into the input, requesting package installation, saving output files and reusing a session container. It calls the same container and language-wrapper functions as the workflow node, rather than routing through the workflow node's handler.

![The workflow handler and agent execution activity have different preparation steps and share container and language-wrapper functions.](figure:sandbox-paths)

Error handling differs too. The agent activity can return an execution result with a nonzero exit code, which the tool includes in its response so the agent can inspect the error. A successful tool invocation therefore does not necessarily mean the submitted program completed successfully. The exit status and error output remain part of the result that the caller needs to examine.

## Passing data into a program

Each language has a wrapper, an interpreter command and an output parser. These functions define the interface between application data and the program running inside the container.

For Python, input data is serialized to JSON, decoded in the generated script and added to its globals. An input object with a `records` field therefore makes a variable named `records` available to the submitted code. The program assigns its output to `result`.

For example, this input contains three records:

```
{
  "records": [
    {"id": "a", "total": 80},
    {"id": "b", "total": 150},
    {"id": "c", "total": 220}
  ]
}
```

The submitted Python can filter them and return a small summary:

```
rows = [record for record in records if record["total"] > 100]
print("Selected", len(rows), "records")
result = {
    "count": len(rows),
    "ids": [record["id"] for record in rows]
}
```

The expected structured result is `{"count": 2, "ids": ["b", "c"]}`. The printed message belongs in the captured stdout. There is no top-level `return`: the wrapper looks for the `result` variable after running the submitted code.

JavaScript follows a similar convention, with input properties assigned to `globalThis` and the submitted code placed inside an async function. Shell inputs become environment variables, and successful stdout becomes the result. These are explicit language adapters, so the same input object does not imply identical syntax in all three languages.

## Separating results from ordinary output

The Python wrapper prints the serialized result between `__FM_RESULT_START__` and `__FM_RESULT_END__`. The parser finds those markers, decodes the enclosed JSON and removes that section from the stdout returned as logs. Exceptions use a corresponding error envelope on stderr.

![Input data and submitted code become a wrapper script. The interpreter emits logs and a marked result, which the parser separates for the caller.](figure:sandbox-result)

This keeps ordinary print statements available without requiring every line of stdout to be valid JSON. It also introduces a protocol that can fail. If output is truncated before both markers arrive, the parser cannot recover the result envelope. If the enclosed text is not valid JSON, the Python parser returns it as a string with a warning.

The captured streams and structured result should therefore be considered together. An empty result may mean the program never assigned `result`, or that its output could not be recovered. The metadata, stderr and warnings help distinguish those cases.

The generated script is written to `/tmp/code.py`, and the execution command is `python3 -u /tmp/code.py`. JavaScript and shell use their own script extensions and interpreter commands. The wrapper is responsible for preparing inputs and describing outputs; it is not the mechanism that isolates the process.

## Configuring the container

The shared creation function builds a Docker container with a read-only root filesystem, dropped Linux capabilities and `no-new-privileges`. It adds a writable temporary filesystem at `/tmp`, limited to 64 MB and mounted with `noexec` and `nosuid`. Networking is disabled unless the caller enables it.

The `noexec` flag needs a precise description. It restricts direct execution from that mount, but an interpreter can still read a script there. FlowMaestro itself uses that arrangement when Python reads `/tmp/code.py`. Chromium's [documentation on interpreters and noexec mounts](https://chromium.googlesource.com/chromiumos/docs/+/master/security/noexec_shell_scripts.md) explains the distinction.

The two public paths expose different choices. The workflow node has an `allowNetworkAccess` setting. The agent tool's current input schema does not expose that option or pass a network override to the activity, so it uses the activity's default of disabled networking.

The blocked-pattern check is another separate control. It recognizes selected operations and can return a useful error before execution. Passing that check is not a proof about every behavior of a program. Both paths still depend on the container configuration and the environment in which Docker runs.

## Following limits through the callers

The shared resource object defines 256 MB of memory, half a CPU core, a 100-process limit, a 30-second timeout and an output-capture setting of `100 * 1024`. Docker receives equal memory and memory-plus-swap limits, so additional swap is disabled.

Those shared values are not necessarily the final settings. The workflow schema defaults memory to 128 MB, and its handler replaces the shared memory value before creating the container. The agent activity merges optional resource overrides into the shared defaults; the agent tool does not supply a memory override. Both public paths default to a 30-second execution timeout and accept a timeout up to five minutes.

The concurrency setting also has a narrower meaning than its name might suggest. `executeInContainer` acquires a process-local slot immediately before starting `docker exec` and releases it when that call settles. The default is ten slots, with further calls placed in a queue.

Container creation happens before that acquisition, and session containers can remain alive between calls. Ten execution slots therefore does not mean at most ten live containers. Queue waiting is also outside the execution timer. These details matter when estimating resource use or explaining how long a request can take.

Output capture is limited separately for stdout and stderr. Although the setting is named `maxOutputBytes`, the implementation compares JavaScript string lengths after decoding chunks and truncates with `substring`. It is not a strict byte limit. Truncation warnings are appended to stderr, so the returned stderr can exceed the configured capture length as well.

## What a session preserves

The agent activity can associate a session ID with a container. When a session is found for the current user, it checks that the language matches and that the container is still running, then updates its activity timestamp and reuses it.

Each call still writes a script and starts a new interpreter with `docker exec`. Reusing the container can preserve files in its temporary filesystem. It does not, by itself, preserve Python variables or a JavaScript heap from the previous process. A multi-step calculation needs to pass its data again or explicitly store it somewhere that the next call can read.

![A session reuses the container and temporary files, while each call starts a fresh interpreter. Idle sessions are removed by periodic cleanup.](figure:sandbox-session)

Session records live in an in-memory map. The default inactivity threshold is ten minutes, and cleanup scans run every two minutes. Expiry is therefore handled by a periodic check, rather than an exact ten-minute deadline. Reuse updates the activity time at the start of the call, and a worker restart loses the in-memory session registry.

Reusing a container also reuses the configuration applied when it was created. The reuse branch does not reapply memory or network settings to the existing container. That is relevant if a future caller exposes more per-call configuration: changing the request would not automatically change the container already associated with the session.

## Timeouts, cleanup and what the tests establish

The execution timer sends `SIGKILL` to the local `docker exec` client and rejects the promise. That code does not itself prove that every process inside a retained container has stopped. The distinction is particularly relevant for sessions, whose containers are intentionally kept for subsequent calls.

The workflow handler requests forced container removal in its finally block. The agent activity requests removal on completion or failure when no session was requested. These cleanup calls are asynchronous, and the removal helper suppresses command failures. A returned result therefore does not confirm that removal has finished successfully.

The repository has unit tests for language wrappers, output parsing, resource constants, session ownership and blocked-pattern matching. The session tests mock the Docker functions. They can check the application's decisions without establishing that Docker enforced a memory limit or terminated an in-container process.

A fuller integration check would run a program that exceeds memory, one that keeps producing output and one that times out inside a retained session. It would inspect the container and processes afterward, then try another session call. That would test the behavior the user depends on beyond the values passed to the Docker command.

Sharing the execution primitives makes it possible to review these behaviors in one place. The callers still need to define their own input contract, error handling and lifetime rules. Those details determine what a code step can reliably offer to a workflow or an agent.
