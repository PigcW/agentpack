import type { DoctorReport } from "../types.js";

export function renderJsonReport(report: DoctorReport): string {
  return `${JSON.stringify({
    agentpack_version: report.agentpackVersion,
    scanned_path: report.scannedPath,
    mode: report.mode,
    readiness_score: report.readinessScore,
    status: report.status,
    category_scoped: report.categoryScoped,
    categories: report.categories,
    findings: report.findings.map((finding) => ({
      rule_id: finding.ruleId,
      category: finding.category,
      severity: finding.severity,
      status: finding.status,
      message: finding.message,
      evidence: finding.evidence,
      recommended_action: finding.recommendedAction,
    })),
    top_actions: report.topActions.map((action) => ({
      rank: action.rank,
      rule_id: action.ruleId,
      severity: action.severity,
      summary: action.summary,
    })),
  }, null, 2)}\n`;
}
