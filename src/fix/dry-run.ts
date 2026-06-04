import type { DoctorReport, Finding } from "../types.js";

export function renderDryRunFix(report: DoctorReport): string {
  const lines = [
    "agentpack fix --dry-run",
    "Dry-run repair preview. No files were written.",
    "",
  ];

  const actionable = report.findings.filter((finding) => finding.status === "fail");

  if (actionable.length === 0) {
    lines.push("No repair actions suggested.");
    return `${lines.join("\n")}\n`;
  }

  for (const finding of actionable) {
    lines.push(formatRepair(finding));
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function formatRepair(finding: Finding): string {
  if (finding.ruleId === "security.secret_not_ignored") {
    return [
      `[${finding.severity}] ${finding.ruleId}`,
      "Target file: .gitignore",
      `Preview: add ${String(finding.evidence.path)} to .gitignore`,
      `Reason: ${finding.recommendedAction}`,
    ].join("\n");
  }

  if (finding.ruleId === "context.no_entry_file") {
    return [
      `[${finding.severity}] ${finding.ruleId}`,
      "Target file: AGENTS.md",
      "Preview: create shared Agent entry file with run, test, read-first, and deny sections",
      `Reason: ${finding.recommendedAction}`,
    ].join("\n");
  }

  return [
    `[${finding.severity}] ${finding.ruleId}`,
    "Target file: manual review",
    `Preview: ${finding.recommendedAction}`,
  ].join("\n");
}
