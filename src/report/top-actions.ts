import type { Finding, Severity, TopAction } from "../types.js";

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function selectTopActions(findings: Finding[]): TopAction[] {
  return findings
    .filter((finding) => finding.status === "fail")
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, 3)
    .map((finding, index) => ({
      rank: index + 1,
      ruleId: finding.ruleId,
      severity: finding.severity,
      summary: finding.recommendedAction,
    }));
}
