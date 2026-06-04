# AgentPack

AgentPack is the project workspace for building AgentPack Doctor.

AgentPack Doctor is a pre-handoff pitfall checker CLI for AI Coding Agent projects. Before a user hands a project to Codex, Claude Code, Cursor, Windsurf, Gemini CLI, OpenClaw, Harness, or another AI Coding Agent, it checks whether the project has obvious avoidable problems.

## Current Product

Current target:

`AgentPack Doctor V0.1`

One-line positioning:

`AgentPack Doctor: AI Coding Agent 接手项目前的防踩坑检查 CLI。`

## Required Reading Order

Any AI Agent or human developer entering this workspace should read these files first:

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/product-spec.md`
4. `docs/implementation-plan.md`
5. `docs/dev-log.md`
6. `docs/decision-log.md`

Do not rely only on chat history. The project files are the source of truth.

## Source Of Truth

- PRD source of truth: `docs/product-spec.md`
- PRD entry file: `docs/PRD.md`
- Implementation route: `docs/implementation-plan.md`
- Development progress: `docs/dev-log.md`
- Product and engineering decisions: `docs/decision-log.md`

## Development Method

Use spec-driven, controlled AI development.

That means:

- implement according to `docs/implementation-plan.md`
- execute one task at a time
- write tests before implementation when the plan requires it
- run the verification commands in each task
- update `docs/dev-log.md` after each task
- update `docs/decision-log.md` when a product or engineering decision changes

If a model wants to add a feature that is not in V0.1, put it in backlog discussion instead of implementing it.

## V0.1 Scope Lock

V0.1 includes:

- `agentpack doctor`
- `agentpack doctor --json`
- `agentpack doctor --ci`
- `agentpack doctor --only security`
- `agentpack doctor --only mcp`
- `agentpack fix --dry-run`

V0.1 excludes:

- real file writes
- real `agentpack fix`
- `agentpack init`
- MCP config sync
- model recommendation
- model comparison
- handoff packages
- cloud, accounts, dashboard, GUI

## Coordination Rules

After each implementation task, append a short entry to `docs/dev-log.md`:

- task completed
- files changed
- commands run
- test result
- open issues
- next recommended step

When a key decision is made, append it to `docs/decision-log.md`:

- date
- decision
- reason
- impact

Do not silently change PRD scope. If implementation discovers a mismatch between plan and reality, record it first.

## Current Status

As of 2026-06-04:

- PRD exists.
- Spec synthesis exists.
- Implementation plan exists.
- Code has not started yet.
- Next step is opening this workspace and executing `docs/implementation-plan.md` from Task 0.
