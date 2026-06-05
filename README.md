# AgentPack Doctor

AgentPack Doctor is a pre-handoff pitfall checker CLI for AI Coding Agent projects.

It helps you check whether a project is ready before handing it to Codex, Claude Code, Cursor, Windsurf, Gemini CLI, OpenClaw, Harness, or another AI Coding Agent.

## Install

During local development:

```bash
npm install
npm run build
node dist/cli.js doctor
```

After package publication, use:

```bash
npx @pigcw/agentpack doctor
```

## Commands

```bash
agentpack doctor
agentpack doctor --json
agentpack doctor --ci
agentpack doctor --only security
agentpack doctor --only mcp
agentpack fix --dry-run
```

## Exit Codes

| Code | Meaning |
|---:|---|
| 0 | No critical findings |
| 1 | One or more critical findings in `--ci` mode |
| 2 | Tool error, invalid arguments, or unsupported command |

## Privacy

AgentPack Doctor V0.1 is local, read-only, and deterministic.

It does not:

- upload file contents
- make network calls
- print secret values
- write files
- apply fixes

Evidence uses paths, config keys, parser locations, and command names. `agentpack fix --dry-run` prints proposed repair actions but never writes files.

## Categories

- Agent Context
- MCP Health
- Security Boundaries
- Local Agent Environment
- Project Readiness

## JSON Output

```bash
agentpack doctor --json
```

The JSON output includes stable `rule_id` values, score, status, category summaries, findings, and top actions.

Status values:

- `ready`
- `needs_attention`
- `not_ready`

Top-level JSON fields include:

- `agentpack_version`
- `scanned_path`
- `mode`
- `readiness_score`
- `status`
- `category_scoped`
- `categories`
- `findings`
- `top_actions`

## Repair Preview

```bash
agentpack fix --dry-run
```

This prints proposed repair actions and never writes files. Real fixes are outside V0.1.

Running `agentpack fix` without `--dry-run` exits with code `2`.

## Project Coordination

This repository is the project workspace for building AgentPack Doctor V0.1.

Source-of-truth files for contributors and AI Agents:

- `docs/product-spec.md` is the canonical PRD.
- `docs/implementation-plan.md` is the canonical implementation route.
- `docs/dev-log.md` is the canonical progress log.
- `docs/decision-log.md` is the canonical decision log.

Do not rely only on chat history. Read `AGENTS.md` before changing code.
