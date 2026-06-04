import type { ProjectContext } from "../core/fs.js";
import { loadGitignore } from "../core/gitignore.js";
import { RULES, type RuleId } from "../rules.js";
import type { Finding } from "../types.js";

const MANIFESTS = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod", "Makefile", "pom.xml"];
const LARGE_DIRS = ["node_modules", "dist", "build", "target", ".venv"];

export async function scanProjectReadiness(context: ProjectContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const manifestPaths = MANIFESTS.filter((manifest) => context.hasFile(manifest));

  if (manifestPaths.length === 0) {
    findings.push(createFinding("project.no_manifest", {
      scanned_manifests: MANIFESTS,
    }));
    return findings;
  }

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

  const gitignore = await loadGitignore(context);
  for (const dir of LARGE_DIRS.filter((dir) => context.hasDir(dir))) {
    if (!gitignore.ignores(dir) && !gitignore.ignores(`${dir}/placeholder`)) {
      findings.push(createFinding("project.large_dir_unexcluded", {
        path: dir,
      }));
    }
  }

  return findings;
}

async function detectTestCommand(context: ProjectContext, manifestPaths: string[]): Promise<boolean> {
  if (manifestPaths.includes("package.json")) {
    const pkg = JSON.parse(await context.readText("package.json")) as { scripts?: Record<string, string> };
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
    const pkg = JSON.parse(await context.readText("package.json")) as { scripts?: Record<string, string> };
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
