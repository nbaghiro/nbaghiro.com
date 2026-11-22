title: Setting up a new Mac with Claude, SSH and Bash
date: 2026-11-22
about: Engineering
cover: /img/posts/setting-up-a-new-mac-with-claude-wide.webp
card: /img/posts/setting-up-a-new-mac-with-claude-card.webp
summary: Moving a development environment with a repeatable setup script and an SSH session, while preserving local Git work, adapting machine-specific paths and keeping credentials out of the setup bundle.

I moved my development environment to a new MacBook this week. I wanted to keep the tools and configuration I already used, along with the parts of my projects that had never reached GitHub: local branches, stashes, uncommitted changes and scratch files.

The migration had two parts. A Bash script installed the baseline environment. Then a Claude Code session on the old Mac used SSH to inspect the new machine, transfer local state and fix differences the script had not anticipated.

That split worked well. The script gave me something I could run again. The SSH session let Claude work through the details of this particular move.

## A setup folder for the repeatable work

I started with a `mac-setup` folder assembled from the old machine. It contained shell, Git and SSH configuration, a Homebrew package list, Claude Code instructions and skills, selected memory files, iTerm2 settings and a list of Cursor extensions.

The script exposed a few entry points:

```bash
./setup.sh           # Core tools, configuration and new SSH keys
./setup.sh --apps    # Also install desktop apps
./setup.sh --repos   # Also clone the listed repositories
./setup.sh --macos   # Also apply selected macOS defaults
```

The optional flags add work to the core setup. Repository cloning needs GitHub access first. Some steps, such as installing the Xcode command line tools, may open an installer and require another run afterward.

The script checks for existing tools and directories before several installation steps. It also backs up changed destination dotfiles before copying its versions into place. That makes rerunning it practical, but it is not a promise that every operation leaves existing state untouched. Dotfiles can be replaced, and package installation can change installed versions.

I also kept installer completion separate from verification. The script reports some package failures as warnings and continues. A successful return from the script does not establish that every dependency is available.

The setup bundle was intended to exclude credentials: no private SSH keys, API tokens or project `.env` files. Those moved separately. Instructions and memory can still contain private project information, so excluding tokens alone does not make a personal setup folder suitable for public distribution.

![Three parts of the move: install the baseline, transfer local state over SSH, and verify the new environment.](figure:mac-setup-phases)

## Give the old machine a route to the new one

Two steps needed me at the new Mac: enabling Remote Login in System Settings and adding the old Mac's public key to the new user's `~/.ssh/authorized_keys`.

The first connection needs the new host's SSH identity checked before trusting it. Once access was established, the old machine could run commands remotely. In the examples below, `new-mac` is an SSH host alias for the destination.

```bash
ssh new-mac 'uname -m; sw_vers'
ssh new-mac 'command -v git; command -v brew; command -v claude'
```

Claude's first useful task was an inventory. It checked the tools on the path, the installed Homebrew packages, Claude's configuration and the project directory. This showed which parts of the script had completed and what still needed attention.

SSH also gave file transfers an encrypted route between the machines. Credentials did not need to pass through email. That transport protection has a specific scope: a command that prints a token can still expose it in terminal output, logs or the agent's session. The transfer commands therefore needed to keep secret values out of their output.

## A different username changes more than the prompt

My username changed on the new Mac. Configuration that referred to the old home directory now pointed at paths that did not exist.

The affected files included Claude instructions, settings and memory, along with Kubernetes and Doppler configuration. Claude backed up each file before updating the relevant path references.

This needs a narrower edit than replacing every occurrence of a username. A path may refer to a remote machine, an example, or a directory outside the migration. Structured configuration also needs to remain valid after the change.

For another move, I would record the old and new home directories explicitly, inspect the matching fields and validate each edited file before replacing the original. Claude's memory directories can encode a project path in their names, so directory names need attention as well as file contents.

## Register the new machine's GitHub key

The setup script generated fresh SSH keys on the new Mac. The old Mac was already signed in to GitHub CLI with permission to add authentication keys, so it could register the new public key:

```bash
ssh new-mac 'cat ~/.ssh/id_ed25519.pub' > newmac_id.pub
gh ssh-key add newmac_id.pub \
  --title "New MacBook" \
  --type authentication
```

Only the public key travels in that command. The new private key stays on the new machine.

Git-over-SSH access and GitHub CLI authentication are separate. In this migration, the existing CLI token was passed directly into the new CLI's standard input:

```bash
set -o pipefail
gh auth token | ssh new-mac \
  'gh auth login --hostname github.com --with-token --git-protocol ssh'
```

The token was not printed by this pipeline. Reusing it still gives the destination access associated with that credential; a fresh login is another option. Shell tracing should be off when running a transfer like this. GitHub CLI normally uses the system credential store, but can fall back to a plaintext file when a store is unavailable, as its [authentication documentation](https://cli.github.com/manual/gh_auth_login) explains.

I checked SSH authentication on the new Mac with `ssh -T git@github.com`. GitHub's successful authentication message also says it does not provide shell access; this check should be interpreted from that response, rather than treating it as an ordinary remote shell command.

## Copy the projects that actually exist

My setup list contained 16 repositories. The old machine's code directory held 48 projects.

Some had no remote. Others had local branches, stashes or uncommitted files. Cloning the repositories on the list would recover only part of the working environment.

The directory was about 96 GB. Much of that was installed dependencies and generated output. Excluding rebuildable directories reduced the transfer to roughly 33 GB.

The transfer used this pattern, run from the parent of the old code directory:

```bash
rsync -a --partial \
  --exclude=node_modules \
  --exclude=.venv \
  --exclude=venv \
  --exclude=.next \
  --exclude=.turbo \
  --exclude=Pods \
  --exclude=DerivedData \
  --exclude=.expo \
  --exclude=.gradle \
  --exclude=__pycache__ \
  code/ new-mac:Documents/code/
```

The trailing slash on `code/` copies its contents into the destination, following [rsync’s directory-copy semantics](https://download.samba.org/pub/rsync/rsync.1). The exclusions leave Git metadata, project configuration and local notes in the transfer. They also leave `.env` files included, which is intentional for this private migration.

Those exclusion names need reviewing for each environment. This is a working-directory transfer, not a complete Mac backup or a transfer of every local database. A directory named `venv`, for example, is skipped wherever the pattern matches.

For a repeat migration, I would stop processes that write to the source before the final synchronization. Copying an actively changing directory does not create a consistent snapshot of all its files. A final dry run, with checksums where needed, can identify remaining differences before switching machines.

## Repair the worktree connections

Linked Git worktrees introduced another path problem. A worktree's `.git` file points to its administrative directory in the main repository. That directory also records where the worktree lives. Moving both under a different home directory can break the references in both directions.

In this move, Claude updated 30 affected `.git` and `gitdir` files, then ran `git status` in each repository to check that Git could open it.

For a reusable procedure, I would start with Git's own repair command. Run from the relocated main repository, it can accept the new paths of linked worktrees:

```bash
git worktree repair /new/path/to/worktree
```

The [Git worktree documentation](https://git-scm.com/docs/git-worktree) covers moving both the main repository and linked worktrees. All the relevant directories must be present; repairing a reference cannot restore files that were not copied.

Opening each repository was a useful first check. Comparing branch heads, stash lists and working-tree changes with the old machine would provide stronger evidence that the working state survived intact.

## Move selected configuration without replacing the new sign-in

CLI configuration and credential files moved separately over SSH. The migration included npm, AWS, Kubernetes and Doppler configuration, along with files used by other service CLIs. Permissions were tightened afterward.

Copying those files does not guarantee that every service is authenticated. Credentials can expire, depend on an operating-system keychain or require a browser flow. The destination still needs a service-by-service check.

Claude Code required a selective merge. In this setup, `~/.claude.json` contained MCP server definitions alongside other local application state. Replacing the entire destination file could have overwritten state established by signing in on the new Mac.

Instead, Claude extracted the relevant MCP entries with `jq`, updated their project paths and merged them into the destination configuration. It kept the new machine's other state in place. MCP configuration can live at different scopes, including project files, so the relevant entries need to be identified for the installation being moved. [Claude's MCP documentation](https://code.claude.com/docs/en/mcp) describes those scopes.

One attempt failed because the command used standard input twice: once to pipe JSON into the remote process and again to provide a script to `bash -s` through a heredoc. The JSON was interpreted as shell input. The error output showed configuration keys; the migration notes did not show secret values in that output.

The correction was to stage the data in a temporary file with restrictive permissions, run the merge separately and remove the file afterward. This gives the script and its input distinct paths. For future runs, the same process should validate the JSON and keep a backup before replacing the destination file.

## What still needed a person

I handled the steps tied to the desktop or an interactive sign-in: enabling Remote Login, approving the initial SSH access, opening Docker Desktop to approve its helper, and signing in to desktop applications and connectors.

Power settings also mattered. The new Mac was configured to sleep quickly, so Claude started `caffeinate` on both machines while the copies and installs ran. That kept inactivity from interrupting the work while I adjusted the settings.

## What was verified, and what was still pending

At the time of the migration notes, the tools, configuration, credentials and project files had been transferred, and Git could open every repository. Project dependency installation was still running. Builds on the new machine had not been checked.

![Migration checks progress from transferred files, to usable repositories, to working applications. The final stage was still pending.](figure:mac-setup-checks)

The remaining checks were practical: finish dependency installation, confirm service authentication, run representative builds and tests, and check local services and development databases. I would keep the old machine intact until those checks pass.

The useful part of this approach was having both a baseline and a way to adapt it. The Bash script captured the recurring setup work. Claude used the SSH session to inspect the destination, transfer local state and resolve the path differences. Keeping a record of what passed and what remained unfinished made the handoff easier to assess.
