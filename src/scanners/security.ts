import type { ProjectContext } from "../core/fs.js";
import { loadGitignore } from "../core/gitignore.js";
import { RULES, type RuleId } from "../rules.js";
import type { Finding } from "../types.js";

const AGENT_ENTRY_FILES = ["AGENTS.md", "CLAUDE.md", ".cursorrules"];
const SENSITIVE_FILE_NAMES = [
  ".env",
  ".env.local",
  ".env.production",
  "id_rsa",
  "id_ed25519",
  "credentials.json",
  "secrets.json",
];
const SENSITIVE_DIR_NAMES = ["secrets", "private", "13pwd"];

export async function scanSecurityBoundaries(context: ProjectContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const gitignore = await loadGitignore(context);
  const files = context.listFiles();
  const dirs = context.listDirs();
  const sensitiveFiles = files.filter((path) => SENSITIVE_FILE_NAMES.some((name) => path === name || path.endsWith(`/${name}`)));
  const sensitiveDirs = dirs.filter((path) => SENSITIVE_DIR_NAMES.some((name) => path === name || path.endsWith(`/${name}`)));
  const agentRulesText = await readAgentRulesText(context);

  for (const path of sensitiveFiles) {
    if (!gitignore.ignores(path)) {
      findings.push(createFinding("security.secret_not_ignored", {
        path,
        rule_checked: ".gitignore",
      }));
    }

    if (!agentRulesText.toLowerCase().includes(path.toLowerCase())) {
      findings.push(createFinding("security.secret_not_denied", {
        path,
        entry_files: AGENT_ENTRY_FILES.filter((entry) => context.hasFile(entry)),
      }));
    }
  }

  for (const path of sensitiveDirs) {
    const protectedByGitignore = gitignore.ignores(path) || gitignore.ignores(`${path}/placeholder`);
    const protectedByAgentRules = agentRulesText.toLowerCase().includes(path.toLowerCase());

    if (!protectedByGitignore || !protectedByAgentRules) {
      findings.push(createFinding("security.sensitive_dir_exposed", {
        path,
        gitignore_protected: protectedByGitignore,
        agent_rules_protected: protectedByAgentRules,
      }));
    }
  }

  return findings;
}

async function readAgentRulesText(context: ProjectContext): Promise<string> {
  const chunks: string[] = [];

  for (const entryFile of AGENT_ENTRY_FILES) {
    if (context.hasFile(entryFile)) {
      chunks.push(await context.readText(entryFile));
    }
  }

  if (context.hasDir(".cursor/rules")) {
    for (const file of context.listFiles().filter((path) => path.startsWith(".cursor/rules/"))) {
      chunks.push(await context.readText(file));
    }
  }

  return chunks.join("\n");
}

function createFinding(ruleId: RuleId, evidence: Finding["evidence"]): Finding {
  const rule = RULES[ruleId];
  return {
    ruleId: rule.ruleId,
    category: rule.category,
    severity: rule.severity,
    status: "fail",
    message: rule.message,
    evidence,
    recommendedAction: rule.recommendedAction,
  };
}
