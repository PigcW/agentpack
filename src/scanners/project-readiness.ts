import type { ProjectContext } from "../core/fs.js";
import { loadGitignore } from "../core/gitignore.js";
import { RULES, type RuleId } from "../rules.js";
import type { Finding } from "../types.js";

const MANIFESTS = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod", "Makefile", "pom.xml"];
const LARGE_DIRS = ["node_modules", "dist", "build", "target", ".venv"];
const AGENT_ENTRY_FILES = ["AGENTS.md", "CLAUDE.md", ".cursorrules"];

export async function scanProjectReadiness(context: ProjectContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const manifestPaths = MANIFESTS.filter((manifest) => context.hasFile(manifest));

  if (manifestPaths.length === 0) {
    findings.push(createFinding("project.no_manifest", {
      scanned_manifests: MANIFESTS,
    }));
  } else {
    const hasTestCommand = await detectTestCommand(context, manifestPaths);
    const hasBuildOrLintCommand = await detectBuildOrLintCommand(context, manifestPaths);

    if (!hasTestCommand) {
      findings.push(createFinding("project.no_test_cmd", {
        manifest_paths: manifestPaths,
      }));
    }

    if (!hasBuildOrLintCommand) {
      findings.push(createFinding("project.no_build_lint", {
        manifest_paths: manifestPaths,
      }));
    }
  }

  const gitignore = await loadGitignore(context);
  const agentRulesText = await readAgentRulesText(context);
  for (const dir of LARGE_DIRS.filter((dir) => context.hasDir(dir))) {
    const gitignoreProtected = gitignore.ignores(dir) || gitignore.ignores(`${dir}/placeholder`);
    const agentRulesProtected = agentRulesText.toLowerCase().includes(dir.toLowerCase());

    if (!gitignoreProtected || !agentRulesProtected) {
      findings.push(createFinding("project.large_dir_unexcluded", {
        path: dir,
        gitignore_protected: gitignoreProtected,
        agent_rules_protected: agentRulesProtected,
      }));
    }
  }

  return findings;
}

async function detectTestCommand(context: ProjectContext, manifestPaths: string[]): Promise<boolean> {
  if (manifestPaths.includes("package.json")) {
    const pkg = await readPackageJson(context);
    if (pkg.scripts && Object.keys(pkg.scripts).some((script) => script === "test" || script.startsWith("test:"))) {
      return true;
    }
  }

  if (manifestPaths.includes("Makefile")) {
    return /^test:/m.test(await context.readText("Makefile"));
  }

  if (manifestPaths.includes("pyproject.toml")) {
    return true;
  }

  if (manifestPaths.includes("Cargo.toml") || manifestPaths.includes("go.mod")) {
    return true;
  }

  return false;
}

async function detectBuildOrLintCommand(context: ProjectContext, manifestPaths: string[]): Promise<boolean> {
  if (manifestPaths.includes("package.json")) {
    const pkg = await readPackageJson(context);
    const scripts = Object.keys(pkg.scripts ?? {});
    if (scripts.some((script) => ["build", "lint"].includes(script) || script.startsWith("build:") || script.startsWith("lint:"))) {
      return true;
    }
  }

  if (manifestPaths.includes("Makefile")) {
    const makefile = await context.readText("Makefile");
    return /^(build|lint):/m.test(makefile);
  }

  return manifestPaths.some((manifest) => ["Cargo.toml", "go.mod", "pom.xml"].includes(manifest));
}

async function readPackageJson(context: ProjectContext): Promise<{ scripts?: Record<string, string> }> {
  try {
    const parsed = JSON.parse(await context.readText("package.json")) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as { scripts?: Record<string, string> };
    }
  } catch {
    return {};
  }

  return {};
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
