import { createProjectContext } from "./core/fs.js";
import { calculateScore } from "./report/score.js";
import { selectTopActions } from "./report/top-actions.js";
import { scanAgentContext } from "./scanners/agent-context.js";
import { scanLocalAgentEnvironment } from "./scanners/environment.js";
import { scanMcpHealth } from "./scanners/mcp.js";
import { scanProjectReadiness } from "./scanners/project-readiness.js";
import { scanSecurityBoundaries } from "./scanners/security.js";
import type { Category, CategorySummary, DoctorReport, Finding, ScanOptions } from "./types.js";

export const AGENTPACK_VERSION = "0.1.1";

export async function runDoctor(options: ScanOptions): Promise<DoctorReport> {
  const context = await createProjectContext(options.projectRoot);
  const findings: Finding[] = [];

  if (options.mode === "full") {
    findings.push(...await scanAgentContext(context));
    findings.push(...await scanMcpHealth(context));
    findings.push(...await scanSecurityBoundaries(context));
    findings.push(...await scanLocalAgentEnvironment(context));
    findings.push(...await scanProjectReadiness(context));
  }

  if (options.mode === "security") {
    findings.push(...await scanSecurityBoundaries(context));
  }

  if (options.mode === "mcp") {
    findings.push(...await scanMcpHealth(context));
  }

  const score = calculateScore(findings);

  return {
    agentpackVersion: AGENTPACK_VERSION,
    scannedPath: context.root,
    mode: options.mode,
    readinessScore: score.readinessScore,
    status: score.status,
    categories: summarizeCategories(findings),
    findings,
    topActions: selectTopActions(findings),
    categoryScoped: options.mode !== "full",
  };
}

function summarizeCategories(findings: Finding[]): Record<Category, CategorySummary> {
  const categories: Record<Category, CategorySummary> = {
    agent_context: { pass: 0, warning: 0, critical: 0, info: 0 },
    mcp_health: { pass: 0, warning: 0, critical: 0, info: 0 },
    security_boundaries: { pass: 0, warning: 0, critical: 0, info: 0 },
    local_agent_environment: { pass: 0, warning: 0, critical: 0, info: 0 },
    project_readiness: { pass: 0, warning: 0, critical: 0, info: 0 },
  };

  for (const finding of findings) {
    if (finding.status === "pass") {
      categories[finding.category].pass += 1;
      continue;
    }

    categories[finding.category][finding.severity] += 1;
  }

  return categories;
}

export type {
  Category,
  CategorySummary,
  DoctorReport,
  Finding,
  ReadinessStatus,
  RunMode,
  ScanOptions,
  Severity,
  TopAction,
} from "./types.js";
