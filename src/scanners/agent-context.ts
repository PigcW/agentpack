import type { ProjectContext } from "../core/fs.js";
import { RULES, type RuleId } from "../rules.js";
import type { Finding } from "../types.js";

const ENTRY_FILES = ["AGENTS.md", "CLAUDE.md", ".cursorrules", ".cursor/rules"];

const RUN_COMMAND_PATTERNS = [/\brun\b/i, /\bstart\b/i, /npm run/i, /pnpm/i, /yarn/i, /make /i];
const TEST_COMMAND_PATTERNS = [/\btest\b/i, /vitest/i, /pytest/i, /cargo test/i, /go test/i];
const DENY_PATTERNS = [/do not read/i, /forbidden/i, /deny/i, /ignore/i, /不要读取/, /禁止/];
const READ_FIRST_PATTERNS = [/read first/i, /start here/i, /先读/, /入口/];

export async function scanAgentContext(context: ProjectContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const entryFiles = ENTRY_FILES.filter((entry) => context.hasFile(entry) || context.hasDir(entry));

  if (entryFiles.length === 0) {
    findings.push(createFinding("context.no_entry_file", {
      scanned_paths: ENTRY_FILES,
    }));
  }

  if (!context.hasFile("README.md")) {
    findings.push(createFinding("context.no_readme", {
      path: "README.md",
    }));
  }

  if (entryFiles.length === 0) {
    return findings;
  }

  const entryText = await readEntryText(context, entryFiles);

  if (!matchesAny(entryText, RUN_COMMAND_PATTERNS)) {
    findings.push(createFinding("context.missing_run_cmd", {
      entry_files: entryFiles,
    }));
  }

  if (!matchesAny(entryText, TEST_COMMAND_PATTERNS)) {
    findings.push(createFinding("context.missing_test_cmd", {
      entry_files: entryFiles,
    }));
  }

  if (!matchesAny(entryText, DENY_PATTERNS)) {
    findings.push(createFinding("context.no_deny_rules", {
      entry_files: entryFiles,
    }));
  }

  if (!matchesAny(entryText, READ_FIRST_PATTERNS)) {
    findings.push(createFinding("context.no_read_first", {
      entry_files: entryFiles,
    }));
  }

  return findings;
}

async function readEntryText(context: ProjectContext, entryFiles: string[]): Promise<string> {
  const chunks: string[] = [];

  for (const entryFile of entryFiles) {
    if (context.hasFile(entryFile)) {
      chunks.push(await context.readText(entryFile));
    }
  }

  return chunks.join("\n");
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
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
