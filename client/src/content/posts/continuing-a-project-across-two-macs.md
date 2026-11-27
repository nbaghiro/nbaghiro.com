title: Continuing a project across two Macs
date: 2026-11-27
about: Engineering
cover: /img/posts/continuing-a-project-across-two-macs-wide.webp
card: /img/posts/continuing-a-project-across-two-macs-card.webp
summary: How an SSH-based workflow lets me continue unfinished work on another Mac and send background tasks to a second machine, with a closer look at workspace handoffs, agent context, and result verification.

I wanted to move between two Macs without making a commit just to carry unfinished work to the other machine. Continuing the work also means carrying over edits, new files, the question an agent is investigating, and any commands still running.

Claude helped me set up a workflow around SSH so I can continue across machines and let agent sessions exchange work. It also gives me somewhere else to run a demanding task while I keep using the computer in front of me.

After [moving my development environment to the new Mac](https://nbaghiro.com/blogs/setting-up-a-new-mac-with-claude), I used Claude to help set up a workflow for continuing unfinished work on either machine.

The workflow handles file transfers, running processes, and agent context separately because each needs a different method of preservation and verification. The commands and message records below are simplified examples of those mechanisms, rather than a transcript of my setup scripts.

## Three kinds of continuity

A working directory contains the current files. An agent session contains the conversation and decisions. A running process contains state that may never have been written to disk.

A file transfer carries the directory contents, while running processes remain on their host. The destination also needs the project’s dependencies and a check that its files match the intended version.

For the workflow to feel continuous, the next machine needs both the correct files and enough context to use them. Each background task also needs an identified machine, directory, and input revision.

![Three separate forms of continuity: project files, agent context, and running processes.](figure:two-macs-state)

Switching computers can mean reconnecting to work that continues on the original machine, or transferring the workspace to run it locally on the destination. The choice depends on whether I need to preserve a running process or work independently of the original host.

## Continue the same process over SSH

For a running task, reconnecting is often simpler than moving it. A terminal multiplexer such as tmux keeps the terminal session on the host while clients detach and reconnect. From the second Mac, the basic shape is:

```bash
ssh -t work-mac 'tmux attach-session -t project'
```

That command attaches to an existing session named `project`. The shell, agent, and working directory remain on `work-mac`. The laptop is another terminal into that environment. This is the behavior described in the [tmux getting-started guide](https://github.com/tmux/tmux/wiki/Getting-Started).

The conversation continues in the existing process, so the agent’s internal session files can stay on that host. The host must remain reachable and awake. Reconnecting after a restart or process termination requires a separate recovery mechanism.

For a browser preview, SSH can forward a local port to the host's development server:

```bash
ssh -N -L 127.0.0.1:8200:127.0.0.1:8200 work-mac
```

The browser opens the local forwarded address, while the application runs on the other Mac. Binding the listener to loopback keeps that local endpoint off other network interfaces. Remote commands and port forwarding are separate uses of the same encrypted transport, documented in the [OpenSSH manual](https://man.openbsd.org/ssh).

This path is useful when the original machine already has the dependencies, containers, and long-running job in place. It does not provide offline work on the second machine.

## Transfer the workspace for local execution

Continuing locally on the other Mac needs a file handoff. The important property is that the transfer can include changes which have never been committed or pushed.

A transfer plan starts by separating source state from machine state. Source files, new assets, and agreed project notes belong in the handoff. Installed dependencies, build caches, sockets, and temporary process files generally do not. Lockfiles travel with the source; dependencies are installed for the destination's operating system, architecture, and runtime versions.

The transfer rules also need to account for ignored files, which can include both disposable output and local experiments. Excluding everything Git ignores can omit work that needs to move with the project.

A basic preview of a transfer might look like this:

```bash
rsync -an --itemize-changes \
  --exclude=node_modules/ \
  --exclude=.venv/ \
  --exclude=dist/ \
  --exclude=.next/ \
  --exclude=.git/ \
  --exclude='.env*' \
  ./ work-mac:handoffs/project/incoming/
```

This dry run previews the files that would be transferred into an incoming directory. A complete handoff also needs the comparison and verification steps described below. Its exclusions are examples to adapt to the project. The `.git` and environment exclusions deliberately leave repository metadata and secrets for separate handling. It does not propagate deletions.

Rsync supports remote-shell transfers, partial-transfer retention, and delayed installation of updated files. Those options help with transport, but they do not make a whole directory replacement transactional or decide which machine owns an edit. The [rsync manual](https://download.samba.org/pub/rsync/rsync.1) documents those distinctions.

## A handoff needs a known starting point

When both machines have changed since their last shared state, the handoff needs to compare their contents. File modification times alone cannot resolve those changes reliably. A recently copied older file can have a newer timestamp, and clocks can disagree.

The useful comparison has three versions: the last agreed snapshot, the source now, and the destination now. For each path, a content fingerprint shows which side changed. If only the source changed, it can advance the destination. If both changed differently, the transfer needs to stop for that path and preserve both versions.

Deletions require the same treatment. If a file was deleted on the source and edited on the destination, both changes need to be considered before applying the deletion. A manifest needs to record removals as well as additions and modifications.

A safe ownership change follows a sequence:

1. Pause the agents, editors, and generators that write to the source workspace.
2. Record the agreed file set, contents, modes, and relevant repository state.
3. Check the destination for changes since the previous handoff.
4. Transfer into staging and verify the received snapshot.
5. Activate the destination and acknowledge the handoff before allowing new edits there.

![Workspace handoff: pause writers, compare against the shared snapshot, stage and verify, then change the active machine.](figure:two-macs-handoff)

Writers on the source must remain paused until the handoff completes. If the connection drops during acknowledgment, the recorded handoff state needs to be checked before either machine resumes writing.

Bidirectional file copying needs coordination to track the active writer and determine when the transfer is complete. Conflicting changes should be preserved for review, where an agent can help explain and reconcile them.

## Preserve the required Git state

Two directories can contain identical source files and still have different Git state. The index records staged changes. The object database contains local commits and stashes. Branch references and `HEAD` describe the checkout. Untracked files sit outside that history.

There are two different handoff contracts. A source-only handoff recreates the files on top of a verified repository baseline. An exact repository handoff also carries the required Git metadata while Git operations are stopped. The first is simpler, but it does not preserve the staged-versus-unstaged distinction by itself. The second needs more care than copying a live `.git` directory in the background.

Linked worktrees add another complication. Their `.git` file points to metadata elsewhere, so copying the visible directory alone is incomplete. Paths and repository relationships need to be re-established on the destination. Git provides worktree repair operations for moved repositories and worktrees; the [worktree documentation](https://git-scm.com/docs/git-worktree) describes those relationships.

The workspace can move directly between the machines, including uncommitted changes. Local commits remain useful for recording progress, but they are optional for the transfer itself.

## How sessions communicate across machines

SSH carries remote commands and files. Communication between agent sessions uses an additional interface to deliver tasks and context over that connection.

Communication needs an explicit interface: a task description, a destination, an acknowledgment, and a way to retrieve results. A receiving session reads that information through its own tools. If it is already running interactively, a bridge or inbox consumer must deliver the task through a supported mechanism. For a file-based inbox, a consumer needs to detect and read incoming messages.

For example, a task record can include:

```json
{
  "task_id": "render-check-017",
  "workspace_snapshot": "snapshot-042",
  "goal": "Render the article at desktop and phone widths",
  "scope": "read source; write screenshots to the task directory",
  "outputs": ["report.json", "screenshots/"],
  "status": "queued"
}
```

The illustrative fields identify the worker’s inputs, permitted changes, and expected outputs. The record can travel over SSH without a shared cloud workspace.

Claude Code also supports non-interactive execution and structured output through its CLI. That is useful for launching a bounded remote task, but it is distinct from continuing an existing interactive conversation. The [programmatic usage documentation](https://code.claude.com/docs/en/headless) covers that interface.

![A task moves from the active session to a remote inbox, runs against an identified snapshot, and returns artifacts for review.](figure:two-macs-message)

For a session handoff, useful context includes the goal, decisions made, changed files, commands already run, failures still unresolved, and the next useful step. It should identify the workspace snapshot it describes. Matching the context to that snapshot helps the receiving session interpret the files correctly.

Raw conversation history can contain machine-specific paths, tool references, or credentials. A context handoff needs to account for those references and keep each installation’s authentication and configuration separate.

## Run background tasks in separate workspaces

The second machine is useful for builds, test suites, browser runs, image rendering, and other work that would otherwise compete with the foreground session. This moves the local tools and processes to the second machine; model inference continues at the provider when the agent uses a cloud-hosted model.

A background worker needs an isolated input snapshot. Letting it test a directory that is changing underneath it makes the result difficult to interpret. A successful test run describes the files it actually read, which may no longer match the current workspace.

Read-only jobs are the easiest starting point. A worker receives a snapshot and returns logs, screenshots, or a report. For editing tasks, it needs a separate checkout or workspace. Its changes return as a reviewable diff against the original input, including new and deleted files. They are then reconciled with any foreground changes.

A local Git worktree can isolate an editing task when its baseline is committed. It does not automatically include the main working directory's uncommitted changes. An unfinished snapshot needs to be supplied explicitly, whether as a patch plus untracked files or as a complete staged copy.

![Foreground work and background work use separate directories. Results carry the input identity and return through review.](figure:two-macs-jobs)

Job identity also matters when the network drops. An SSH timeout means the caller stopped receiving an answer; it does not prove that the remote job stopped. Retrying the same task ID should first inspect the existing run. Otherwise a reconnect can launch another expensive build or apply an edit twice.

A useful result includes the input fingerprint, tool versions, commands, exit codes, artifacts, and completion state. An explicit completion state distinguishes a finished run from a partial result or an agent waiting for permission.

## Credentials, application data, and backups

The workspace stays on my own machines and can move between them without a push to a repository host. Cloud-backed agents may still send selected context to their model providers, and development commands can call external services.

Credentials belong to each machine's setup. SSH host identities need to be verified, keys should be scoped to the intended access, and task payloads should be passed as data rather than interpolated into shell commands. Scripts also need to keep secrets out of logs, independently of the connection’s encryption.

Databases also need their own transfer method. Copying live database files or container volumes alongside source code is not a reliable application-state handoff. Use an application-supported export, a consistent database snapshot, or a shared development service with deliberate access rules.

Independent backups provide recovery if an accidental deletion or unwanted change is transferred to both computers.

## Continuing work across machines

Claude helped connect the shell commands, SSH access, paths, repository state, and session context needed for this workflow.

I can continue unfinished work from another computer and use the second machine for background tasks when the current one is busy.

The workflow records the active machine, the snapshot each job used, and the location of its results. That information helps me and the agents continue without having to reconstruct the previous session’s state.
