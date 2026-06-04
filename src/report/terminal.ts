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
    `  evidence: ${formatEvidence(finding)}`,
    `  action: ${finding.recommendedAction}`,
  ].join("\n");
}

function formatEvidence(finding: Finding): string {
  const evidence = finding.evidence;
  switch (finding.ruleId) {
    case "context.no_entry_file":
      return `missing ${formatValue(evidence.scanned_paths)}`;
    case "context.no_readme":
    case "security.secret_not_ignored":
      return String(evidence.path);
    case "context.missing_run_cmd":
    case "context.missing_test_cmd":
    case "context.no_deny_rules":
    case "context.no_read_first":
      return `entry files checked: ${formatValue(evidence.entry_files)}`;
    case "mcp.invalid_format":
      return `${formatValue(evidence.config_path)}; ${formatValue(evidence.parser_error)} at ${formatValue(evidence.parser_location)}`;
    case "mcp.duplicate_server":
      return `server "${formatValue(evidence.server_name)}" in ${formatValue(evidence.config_path)}`;
    case "mcp.cross_tool_conflict":
      return `server "${formatValue(evidence.server_name)}" differs in ${formatValue(evidence.config_paths)}`;
    case "mcp.missing_command":
      return `server "${formatValue(evidence.server_name)}" references missing command "${formatValue(evidence.command)}" in ${formatValue(evidence.config_path)}`;
    case "mcp.risky_stdio":
      return `server "${formatValue(evidence.server_name)}" uses ${formatValue(evidence.command_fragment)} in ${formatValue(evidence.config_path)}`;
    case "security.secret_not_denied":
      return `no Agent rule mentions ${formatValue(evidence.path)}`;
    case "security.sensitive_dir_exposed":
    case "project.large_dir_unexcluded":
      return `${formatValue(evidence.path)}; .gitignore protected: ${formatValue(evidence.gitignore_protected)}; Agent rules protected: ${formatValue(evidence.agent_rules_protected)}`;
    case "project.no_manifest":
      return `missing ${formatValue(evidence.scanned_manifests)}`;
    case "project.no_test_cmd":
    case "project.no_build_lint":
      return `manifests checked: ${formatValue(evidence.manifest_paths)}`;
    default:
      return Object.entries(evidence)
        .map(([key, value]) => `${key}: ${formatValue(value)}`)
        .join("; ");
  }
}

function formatValue(value: Finding["evidence"][string] | undefined): string {
  if (Array.isArray(value)) {
    return value.length === 0 ? "none" : value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  return String(value ?? "unknown");
}
