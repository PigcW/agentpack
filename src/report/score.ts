import type { Finding, ScoreResult } from "../types.js";

export function calculateScore(findings: Finding[]): ScoreResult {
  const failed = findings.filter((finding) => finding.status === "fail");
  const criticalCount = failed.filter((finding) => finding.severity === "critical").length;
  const warningCount = failed.filter((finding) => finding.severity === "warning").length;
  const readinessScore = Math.max(0, 100 - criticalCount * 25 - warningCount * 8);

  if (criticalCount > 0 || readinessScore < 60) {
    return { readinessScore, status: "not_ready" };
  }

  if (readinessScore < 90) {
    return { readinessScore, status: "needs_attention" };
  }

  return { readinessScore, status: "ready" };
}
