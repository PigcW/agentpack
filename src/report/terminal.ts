import pc from "picocolors";
import type { Category, DoctorReport, Finding } from "../types.js";

const CATEGORY_LABELS: Record<Category, string> = {
  agent_context: "Agent Context",
  mcp_health: "MCP Health",
  security_boundaries: "Security Boundaries",
  local_agent_environment: "Local Agent Environment",
  project_readiness: "Project Readiness",
};

export function renderTerminalReport(report: DoctorReport): string {
  const lines: string[] = [
    `agentpack doctor v${report.agentpackVersion}`,
    `Scanning: ${report.scannedPath}`,
    "",
    `${report.categoryScoped ? "Category Score" : "Agent Readiness Score"}: ${report.readinessScore} / 100`,
    `Status: ${report.status.toUpperCase()}`,
    "",
  ];

  for (const category of Object.keys(CATEGORY_LABELS) as Category[]) {
    const categoryFindings = report.findings.filter((finding) => finding.category === category);
    if (report.categoryScoped && categoryFindings.length === 0) {
      continue;
    }

    lines.push(`-- ${CATEGORY_LABELS[category]} -----------------------------------`);
    if (categoryFindings.length === 0) {
      lines.push("[pass] No findings");
      lines.push("");
      continue;
    }

    for (const finding of categoryFindings) {
      lines.push(formatFinding(finding));
    }
    lines.push("");
  }

  lines.push("-- Top 3 Actions -----------------------------------");
  if (report.topActions.length === 0) {
    lines.push("No blocking actions.");
  } else {
    for (const action of report.topActions) {
      lines.push(`${action.rank}. ${action.summary} [${action.severity}]`);
    }
  }

  lines.push("");
  lines.push("Run with --json for machine output.");
  return `${lines.join("\n")}\n`;
}

function formatFinding(finding: Finding): string {
  const severity = finding.severity === "critical"
    ? pc.red(finding.severity)
    : finding.severity === "warning"
      ? pc.yellow(finding.severity)
      : pc.cyan(finding.severity);

  return [
    `[${severity}] ${finding.message}`,
    `  evidence: ${JSON.stringify(finding.evidence)}`,
    `  action: ${finding.recommendedAction}`,
  ].join("\n");
}
