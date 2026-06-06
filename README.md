# AgentPack Doctor

[中文文档](./README.zh-CN.md)

AgentPack Doctor is a local CLI that checks whether a project is ready to be handed to AI coding agents such as Codex, Claude Code, Cursor, Gemini CLI, OpenClaw, Harness, and similar tools.

It focuses on the problems that usually waste time before an agent starts coding: missing project context, unsafe secret boundaries, broken MCP configuration, unclear run/test commands, and generated directories that are easy for agents to read by accident.

## Install

Run it directly with npx:

```bash
npx @pigcw/agentpack doctor
```

Or install it in a project:

```bash
npm install -D @pigcw/agentpack
npx agentpack doctor
```

Requirements:

- Node.js 20 or newer

## Quick Start

Run the full project readiness check from the root of your project:

```bash
npx @pigcw/agentpack doctor
```

Use JSON output when another tool, CI job, or agent needs to consume the report:

```bash
npx @pigcw/agentpack doctor --json
```

Fail CI only when critical findings exist:

```bash
npx @pigcw/agentpack doctor --ci
```

Preview suggested repairs without writing files:

```bash
npx @pigcw/agentpack fix --dry-run
```

## Commands

| Command | What it does |
| --- | --- |
| `agentpack doctor` | Runs the full readiness check. |
| `agentpack doctor --json` | Prints valid JSON only. |
| `agentpack doctor --ci` | Uses CI-friendly exit codes. |
| `agentpack doctor --only security` | Runs only security boundary checks. |
| `agentpack doctor --only mcp` | Runs only MCP configuration checks. |
| `agentpack fix --dry-run` | Shows repair previews without writing files. |

Real file-writing fixes are not enabled in v0.1.

## What It Checks

### Agent Context

Checks whether the project gives AI agents a clear entry point.

It looks for:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursorrules`
- `.cursor/rules`
- `README.md`
- documented run/start commands
- documented test commands
- do-not-read or boundary rules
- read-first guidance

### MCP Health

Checks common MCP configuration problems across:

- `.mcp.json`
- `.cursor/mcp.json`
- `.codex/config.toml`

It detects:

- invalid JSON or TOML syntax
- duplicate server names in one config
- same MCP server name with different definitions across tools
- commands that do not exist locally
- risky stdio command patterns such as shell wrappers, `sudo`, `rm -rf`, or `curl | sh`

Secret-looking command arguments are redacted in output.

### Security Boundaries

Checks whether sensitive files and folders are excluded from both Git and agent context.

It currently looks for common sensitive files such as:

- `.env`
- `.env.local`
- `.env.production`
- `id_rsa`
- `id_ed25519`
- `credentials.json`
- `secrets.json`

It also checks sensitive directories such as:

- `secrets`
- `private`
- `13pwd`

### Local Agent Environment

Reports whether common local agent tools appear to be available:

- Codex CLI
- Claude Code CLI
- Gemini CLI
- Cursor MCP config
- OpenClaw or Harness

These are informational checks. They help you understand the local handoff environment.

### Project Readiness

Checks whether the project has a recognizable shape and basic automation.

It looks for:

- common manifests such as `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, and `pom.xml`
- test commands
- build or lint commands
- generated or large directories such as `node_modules`, `dist`, `build`, `target`, and `.venv` that are not excluded from Git and agent rules

## Output

The terminal report includes:

- readiness score
- status
- category summaries
- findings with evidence
- recommended actions
- top 3 actions

Status values:

| Status | Meaning |
| --- | --- |
| `ready` | No blocking problems found. |
| `needs_attention` | Some warnings or cleanup items exist. |
| `not_ready` | Critical issues should be fixed before agent handoff. |

JSON output includes stable fields for automation:

```bash
npx @pigcw/agentpack doctor --json
```

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

## Exit Codes

| Code | Meaning |
| ---: | --- |
| `0` | Command completed. In `--ci` mode, no critical findings were found. |
| `1` | `--ci` mode found one or more critical findings. |
| `2` | Invalid arguments, unsupported command, or tool error. |

## Privacy

AgentPack Doctor v0.1 is local, read-only, and deterministic.

It does not:

- upload file contents
- make network calls during scans
- print secret values
- write files
- apply fixes

Evidence is limited to paths, config keys, parser locations, command names, and redacted command fragments.

## Typical Workflow

Use AgentPack Doctor before asking an AI coding agent to work on a project:

```bash
npx @pigcw/agentpack doctor
```

Then fix the top findings, especially:

- create or improve `AGENTS.md`
- add run/test instructions
- add do-not-read rules for secrets
- add missing ignore rules
- clean up MCP configuration conflicts
- exclude generated directories from agent context

Run the check again before handing the project to an agent.

## Development

```bash
npm install
npm run build
npm test
```

Run the CLI from source:

```bash
npm run dev -- doctor
```

## License

MIT
