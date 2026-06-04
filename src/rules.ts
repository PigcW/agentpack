import type { Category, Severity } from "./types.js";

export interface RuleDefinition {
  ruleId: string;
  category: Category;
  severity: Severity;
  message: string;
  recommendedAction: string;
}

export const RULES = {
  "context.no_entry_file": {
    ruleId: "context.no_entry_file",
    category: "agent_context",
    severity: "critical",
    message: "No Agent entry file found",
    recommendedAction: "Create AGENTS.md as the shared Agent entry",
  },
  "context.no_readme": {
    ruleId: "context.no_readme",
    category: "agent_context",
    severity: "warning",
    message: "Missing README",
    recommendedAction: "Add README.md with project purpose",
  },
  "context.missing_run_cmd": {
    ruleId: "context.missing_run_cmd",
    category: "agent_context",
    severity: "warning",
    message: "Agent entry file does not document a run/start command",
    recommendedAction: "Add start command guidance to the Agent entry file",
  },
  "context.missing_test_cmd": {
    ruleId: "context.missing_test_cmd",
    category: "agent_context",
    severity: "warning",
    message: "Agent entry file does not document a test command",
    recommendedAction: "Add test command guidance to the Agent entry file",
  },
  "context.no_deny_rules": {
    ruleId: "context.no_deny_rules",
    category: "agent_context",
    severity: "warning",
    message: "No forbidden directory or boundary rule found",
    recommendedAction: "Add forbidden paths and work boundaries",
  },
  "context.no_read_first": {
    ruleId: "context.no_read_first",
    category: "agent_context",
    severity: "info",
    message: "No read-first guidance found",
    recommendedAction: "Add a read-first section to the Agent entry file",
  },
  "mcp.invalid_format": {
    ruleId: "mcp.invalid_format",
    category: "mcp_health",
    severity: "critical",
    message: "MCP config has invalid syntax",
    recommendedAction: "Fix MCP config syntax",
  },
  "mcp.duplicate_server": {
    ruleId: "mcp.duplicate_server",
    category: "mcp_health",
    severity: "warning",
    message: "Duplicate MCP server name in one config",
    recommendedAction: "Remove or rename the duplicate server",
  },
  "mcp.cross_tool_conflict": {
    ruleId: "mcp.cross_tool_conflict",
    category: "mcp_health",
    severity: "warning",
    message: "Same MCP server name differs across tools",
    recommendedAction: "Reconcile server definitions",
  },
  "mcp.missing_command": {
    ruleId: "mcp.missing_command",
    category: "mcp_health",
    severity: "warning",
    message: "MCP command or path does not exist",
    recommendedAction: "Install the command or fix the path",
  },
  "mcp.risky_stdio": {
    ruleId: "mcp.risky_stdio",
    category: "mcp_health",
    severity: "warning",
    message: "stdio MCP server uses a risky command pattern",
    recommendedAction: "Review trust level before enabling",
  },
  "security.secret_not_ignored": {
    ruleId: "security.secret_not_ignored",
    category: "security_boundaries",
    severity: "critical",
    message: "Sensitive file is not excluded by .gitignore",
    recommendedAction: "Add the sensitive path to .gitignore and rotate the secret if needed",
  },
  "security.secret_not_denied": {
    ruleId: "security.secret_not_denied",
    category: "security_boundaries",
    severity: "warning",
    message: "Sensitive file is not denied in Agent rules",
    recommendedAction: "Add a do-not-read rule to the Agent entry file",
  },
  "security.sensitive_dir_exposed": {
    ruleId: "security.sensitive_dir_exposed",
    category: "security_boundaries",
    severity: "warning",
    message: "Sensitive directory exposed to Agent scan",
    recommendedAction: "Add ignore and deny rules for the sensitive directory",
  },
  "env.codex_detected": {
    ruleId: "env.codex_detected",
    category: "local_agent_environment",
    severity: "info",
    message: "Codex CLI detection result",
    recommendedAction: "No action required",
  },
  "env.claude_detected": {
    ruleId: "env.claude_detected",
    category: "local_agent_environment",
    severity: "info",
    message: "Claude Code CLI detection result",
    recommendedAction: "No action required",
  },
  "env.gemini_detected": {
    ruleId: "env.gemini_detected",
    category: "local_agent_environment",
    severity: "info",
    message: "Gemini CLI detection result",
    recommendedAction: "No action required",
  },
  "env.cursor_config_detected": {
    ruleId: "env.cursor_config_detected",
    category: "local_agent_environment",
    severity: "info",
    message: "Cursor configuration detection result",
    recommendedAction: "No action required",
  },
  "env.openclaw_harness_detected": {
    ruleId: "env.openclaw_harness_detected",
    category: "local_agent_environment",
    severity: "info",
    message: "OpenClaw or Harness detection result",
    recommendedAction: "No action required",
  },
  "project.no_manifest": {
    ruleId: "project.no_manifest",
    category: "project_readiness",
    severity: "warning",
    message: "Missing project manifest",
    recommendedAction: "Add a project manifest or command documentation",
  },
  "project.no_test_cmd": {
    ruleId: "project.no_test_cmd",
    category: "project_readiness",
    severity: "warning",
    message: "No recognizable test command",
    recommendedAction: "Define a test command",
  },
  "project.no_build_lint": {
    ruleId: "project.no_build_lint",
    category: "project_readiness",
    severity: "info",
    message: "No build or lint command found",
    recommendedAction: "Add build or lint command if relevant",
  },
  "project.large_dir_unexcluded": {
    ruleId: "project.large_dir_unexcluded",
    category: "project_readiness",
    severity: "info",
    message: "Large or generated directory is not excluded",
    recommendedAction: "Exclude generated directories from Agent context",
  },
} satisfies Record<string, RuleDefinition>;

export type RuleId = keyof typeof RULES;
