# Repository instructions

Read `CLAUDE.md` for the repository architecture, conventions, and required checks.

## Start of work

At the start of a new task, before editing files:

1. Inspect `git status --short` and the current branch.
2. Run `git fetch origin` to check for remote updates. If it fails, report the
   failure; do not describe cached remote refs as the latest remote state.
3. Unless the user explicitly selected a historical revision or PR branch, use
   the current branch's upstream as the update target. For the environment's
   `work` branch without an upstream, use `origin/main`.
4. If the working tree is clean and HEAD is an ancestor of the update target,
   run `git merge --ff-only <target>` to bring the working files up to date.
   If fetching failed, an already available target may still be used, but
   explain that its freshness could not be verified.
5. Preserve local changes and commits. Never automatically reset, stash, rebase,
   switch branches, or merge diverged history to synchronize the checkout.
   If an update cannot be applied safely, report the state and continue with
   independent work where possible.

When a requested path is missing, check available Git refs and any commit the
user supplied before concluding that its contents are unavailable.
