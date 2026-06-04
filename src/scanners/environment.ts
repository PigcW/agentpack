import type { CommandDetector } from "../core/commands.js";
import { defaultCommandDetector } from "../core/commands.js";
import type { ProjectContext } from "../core/fs.js";
import { RULES, type RuleId } from "../rules.js";
import type { Finding } from "../types.js";

export async function scanLocalAgentEnvironment(
  context: ProjectContext,
  detector: CommandDetector = defaultCommandDetector,
): Promise<Finding[]> {
  return [
    createFinding("env.codex_detected", {
      command: "codex",
      detected: await detector.commandExists("codex"),
    }),
    createFinding("env.claude_detected", {
      command: "claude",
      detected: await detector.commandExists("claude"),
    }),
    createFinding("env.gemini_detected", {
      command: "gemini",
      detected: await detector.commandExists("gemini"),
    }),
    createFinding("env.cursor_config_detected", {
      path: ".cursor/mcp.json",
      detected: context.hasFile(".cursor/mcp.json"),
    }),
    createFinding("env.openclaw_harness_detected", {
      commands: ["openclaw", "harness"],
      detected: await detector.commandExists("openclaw") || await detector.commandExists("harness"),
    }),
  ];
}

function createFinding(ruleId: RuleId, evidence: Finding["evidence"]): Finding {
  const rule = RULES[ruleId];
  return {
    ruleId: rule.ruleId,
    category: rule.category,
    severity: rule.severity,
    status: "pass",
    message: rule.message,
    evidence,
    recommendedAction: rule.recommendedAction,
  };
}
