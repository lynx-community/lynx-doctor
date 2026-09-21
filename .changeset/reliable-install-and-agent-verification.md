---
"lynx-doctor": minor
---

Make installation reproducible and verify repairs made by coding agents.

- Generate an executable, version-pinned `doctor` script and project-aware GitHub Actions workflow, including monorepo locations and package-manager detection. Preserve existing scripts, workflows, and agent notes; preview additions with `install --dry-run`.
- Resolve typed `defineConfig` imports when running a standalone installation through `npx`, and embed the package version in the built CLI.
- Support bare `--agent` with `agent.command` or Codex as the default. Configuration alone does not start an agent.
- Rescan after a successful agent run and use the verified report for the exit status. Diff scans verify the full working tree; staged scans still check the Git index. Agent failures return a nonzero status even with `--blocking none`.
- Include scan scope and coverage notices in reports, and avoid presenting empty scans as a complete health check.

Agent handoffs require text output: run `--json` and `--score` separately from `--agent` or `--agent-prompt`. JSON and score modes are also mutually exclusive. Review and stage agent edits before expecting a staged verification to pass.
