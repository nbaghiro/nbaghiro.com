title: Continuing a project across two Macs
date: 2026-11-27
about: Engineering
cover: /img/posts/continuing-a-project-across-two-macs-wide.webp
card: /img/posts/continuing-a-project-across-two-macs-card.webp
summary: How an SSH-based workflow lets me continue unfinished work on another Mac and send background tasks to a second machine, with a closer look at workspace handoffs, agent context, and result verification.

I wanted to move between two Macs without making a commit just to carry unfinished work to the other machine. The useful state of a project includes more than its last commit: edits, new files, the question an agent is investigating, and the command that is still running.

Claude helped me set up a workflow around SSH so I can continue across machines and let agent sessions exchange work. It also gives me somewhere else to run a demanding task while I keep using the computer in front of me.

This follows the [earlier move to a new Mac](https://nbaghiro.com/blogs/setting-up-a-new-mac-with-claude). Installing the environment was one job. Keeping unfinished work usable across both machines is another.

The technical distinction is between moving files, continuing a process, and handing context to another agent. They can feel like one action at the keyboard, but each has a different boundary. The commands and message records below are simplified examples of those mechanisms, rather than a transcript of my setup scripts.

## Three kinds of continuity

A working directory contains the current files. An agent session contains the conversation and decisions. A running process contains state that may never have been written to disk.

Copying the directory does not move the process. Copying a conversation does not install dependencies. Being able to reach the other Mac does not establish which copy is newer.

For the workflow to feel continuous, the next machine needs both the correct files and enough context to use them. Background work also needs a clear home: a particular machine, directory, and input revision.

![Three separate forms of continuity: project files, agent context, and running processes.](figure:two-macs-state)

There are two useful ways to switch computers. One keeps execution on the original machine and changes where I connect from. The other transfers the workspace so execution can continue locally on the destination. It helps to make that choice explicit.

## Continue the same process over SSH

For a running task, reconnecting is often simpler than moving it. A terminal multiplexer such as tmux keeps the terminal session on the host while clients detach and reconnect. From the second Mac, the basic shape is:

```bash
ssh -t work-mac 'tmux attach-session -t project'
```

That command attaches to an existing session named `project`. The shell, agent, and working directory remain on `work-mac`. The laptop is another terminal into that environment. This is the behavior described in the [tmux getting-started guide](https://github.com/tmux/tmux/wiki/Getting-Started).

It preserves the running conversation without trying to synchronize an agent's internal session files. It also preserves the limits of the host: it must remain reachable and awake. A detached terminal is not protection against a restart, a killed process, or a sleeping computer.

For a browser preview, SSH can forward a local port to the host's development server:

```bash
ssh -N -L 127.0.0.1:8200:127.0.0.1:8200 work-mac
```

The browser opens the local forwarded address, while the application runs on the other Mac. Binding the listener to loopback keeps that local endpoint off other network interfaces. Remote commands and port forwarding are separate uses of the same encrypted transport, documented in the [OpenSSH manual](https://man.openbsd.org/ssh).

This path is useful when the original machine already has the dependencies, containers, and long-running job in place. It does not provide offline work on the second machine.

## Move the workspace when the work needs to move

Continuing locally on the other Mac needs a file handoff. The important property is that the transfer can include changes which have never been committed or pushed.

A transfer plan starts by separating source state from machine state. Source files, new assets, and agreed project notes belong in the handoff. Installed dependencies, build caches, sockets, and temporary process files generally do not. Lockfiles travel with the source; dependencies are installed for the destination's operating system, architecture, and runtime versions.

Ignored files need a policy of their own. Some are disposable output. Others are the only copy of a local experiment. A blanket rule that excludes everything Git ignores can silently omit useful work.

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

This is a dry run into an incoming directory, not a complete synchronization protocol. Its exclusions are examples to adapt to the project. The `.git` and environment exclusions deliberately leave repository metadata and secrets for separate handling. It does not propagate deletions.

Rsync supports remote-shell transfers, partial-transfer retention, and delayed installation of updated files. Those options help with transport, but they do not make a whole directory replacement transactional or decide which machine owns an edit. The [rsync manual](https://download.samba.org/pub/rsync/rsync.1) documents those distinctions.

## A handoff needs a known starting point

The dangerous case is two machines that have both changed since their last shared state. File modification times are insufficient to resolve that. A recently copied older file can have a newer timestamp, and clocks can disagree.

The useful comparison has three versions: the last agreed snapshot, the source now, and the destination now. For each path, a content fingerprint shows which side changed. If only the source changed, it can advance the destination. If both changed differently, the transfer needs to stop for that path and preserve both versions.

Deletions require the same treatment. A missing source file is not permission to erase a destination file that someone has since edited. A manifest needs to record removals as well as additions and modifications.

A safe ownership change follows a sequence:

1. Pause the agents, editors, and generators that write to the source workspace.
2. Record the agreed file set, contents, modes, and relevant repository state.
3. Check the destination for changes since the previous handoff.
4. Transfer into staging and verify the received snapshot.
5. Activate the destination and acknowledge the handoff before allowing new edits there.

![Workspace handoff: pause writers, compare against the shared snapshot, stage and verify, then change the active machine.](figure:two-macs-handoff)

The source must stay quiet until the decision completes. If the connection disappears during acknowledgment, neither side should infer that silence means it owns the workspace. Recovering requires checking the recorded handoff state.

This is also why two independent file watchers copying in opposite directions are not enough. A dependable switch has an owner and a completion condition. The agent can explain a conflict and help reconcile it; the underlying copy operation should not guess.

## Git state is more than the visible files

Two directories can contain identical source files and still have different Git state. The index records staged changes. The object database contains local commits and stashes. Branch references and `HEAD` describe the checkout. Untracked files sit outside that history.

There are two different handoff contracts. A source-only handoff recreates the files on top of a verified repository baseline. An exact repository handoff also carries the required Git metadata while Git operations are stopped. The first is simpler, but it does not preserve the staged-versus-unstaged distinction by itself. The second needs more care than copying a live `.git` directory in the background.

Linked worktrees add another complication. Their `.git` file points to metadata elsewhere, so copying the visible directory alone is incomplete. Paths and repository relationships need to be re-established on the destination. Git provides worktree repair operations for moved repositories and worktrees; the [worktree documentation](https://git-scm.com/docs/git-worktree) describes those relationships.

None of this requires publishing an unfinished change to GitHub. A local commit is still available when useful, but switching machines does not have to depend on making one. Version history and workspace transport serve different purposes.

## How sessions communicate across machines

An SSH connection gives an agent a way to execute a remote command or transfer a file. It does not automatically connect two conversations or give them shared memory.

Communication needs an explicit interface: a task description, a destination, an acknowledgment, and a way to retrieve results. A receiving session reads that information through its own tools. If it is already running interactively, a bridge or inbox consumer must deliver the task through a supported mechanism. Writing a file somewhere does not guarantee the session will notice it.

A task record can make the boundary concrete:

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

These names are illustrative. What matters is that the receiving worker knows which inputs to use, what it may change, and what counts as a result. The record can travel over SSH without a shared cloud workspace.

Claude Code also supports non-interactive execution and structured output through its CLI. That is useful for launching a bounded remote task, but it is distinct from continuing an existing interactive conversation. The [programmatic usage documentation](https://code.claude.com/docs/en/headless) covers that interface.

![A task moves from the active session to a remote inbox, runs against an identified snapshot, and returns artifacts for review.](figure:two-macs-message)

For a session handoff, useful context includes the goal, decisions made, changed files, commands already run, failures still unresolved, and the next useful step. It should identify the workspace snapshot it describes. A clear summary attached to the wrong files is still a bad handoff.

Raw conversation history can contain machine-specific paths, tool references, or credentials. Treating an entire agent configuration directory as interchangeable between two active installations creates more problems than a deliberate context handoff solves.

## Use the other Mac without creating a second editor of everything

The second machine is useful for builds, test suites, browser runs, image rendering, and other work that would otherwise compete with the foreground session. The local load being moved is those tools and processes. A cloud-hosted model's inference does not become local merely because its CLI runs on another Mac.

A background worker needs an isolated input snapshot. Letting it test a directory that is changing underneath it makes the result difficult to interpret. A successful test run describes the files it actually read, which may no longer match the current workspace.

Read-only jobs are the easiest starting point. A worker receives a snapshot and returns logs, screenshots, or a report. For editing tasks, it needs a separate checkout or workspace. Its changes return as a reviewable diff against the original input, including new and deleted files. They are then reconciled with any foreground changes.

A local Git worktree can isolate an editing task when its baseline is committed. It does not automatically include the main working directory's uncommitted changes. An unfinished snapshot needs to be supplied explicitly, whether as a patch plus untracked files or as a complete staged copy.

![Foreground work and background work use separate directories. Results carry the input identity and return through review.](figure:two-macs-jobs)

Job identity also matters when the network drops. An SSH timeout means the caller stopped receiving an answer; it does not prove that the remote job stopped. Retrying the same task ID should first inspect the existing run. Otherwise a reconnect can launch another expensive build or apply an edit twice.

A useful result includes the input fingerprint, tool versions, commands, exit codes, artifacts, and completion state. “Done” is not enough to distinguish a finished run from a partial result or an agent waiting for permission.

## Local files still have boundaries

Keeping the workspace on my own machines removes the need to push unfinished code through a repository host merely to continue working. It does not mean every part of the workflow is offline. A cloud-backed coding agent may send selected context to its model provider, and development commands can call external services.

Credentials belong to each machine's setup. SSH host identities need to be verified, keys should be scoped to the intended access, and task payloads should be passed as data rather than interpolated into shell commands. Encryption protects the connection; it does not prevent a script from printing a secret into a log.

Databases also need their own transfer method. Copying live database files or container volumes alongside source code is not a reliable application-state handoff. Use an application-supported export, a consistent database snapshot, or a shared development service with deliberate access rules.

Finally, synchronization is not a backup. An accidental deletion can be faithfully transferred to the other computer. Independent, recoverable snapshots are still valuable.

## What makes the switch feel simple

Claude was useful in setting this up because the work crossed several boundaries: shell commands, SSH access, paths, repository state, and the information a second session needs to continue.

The result I care about is straightforward. I can leave unfinished work unfinished, continue from another computer, and use the second machine for background tasks when the current one is busy.

Underneath that experience, the important questions stay explicit: which machine owns the files, which snapshot a job used, where its result lives, and whether it is safe to continue. Getting those answers out of my head and into the workflow is what makes moving between machines practical.
