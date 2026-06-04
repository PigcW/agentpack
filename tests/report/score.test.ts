import { describe, expect, it } from "vitest";
import { calculateScore } from "../../src/report/score.js";
import type { Finding } from "../../src/types.js";

function finding(severity: Finding["severity"]): Finding {
  return {
    ruleId: `test.${severity}`,
    category: "agent_context",
    severity,
    status: "fail",
    message: `${severity} finding`,
    evidence: { path: "AGENTS.md" },
    recommendedAction: `${severity} action`,
  };
}

describe("calculateScore", () => {
  it("keeps a clean project ready", () => {
    expect(calculateScore([])).toEqual({
      readinessScore: 100,
      status: "ready",
    });
  });

  it("subtracts 25 per critical finding and forces not_ready", () => {
    expect(calculateScore([finding("critical")])).toEqual({
      readinessScore: 75,
      status: "not_ready",
    });
  });

  it("subtracts 8 per warning and returns needs_attention for 60-89", () => {
    const findings = [
      finding("warning"),
      finding("warning"),
      finding("warning"),
    ];

    expect(calculateScore(findings)).toEqual({
      readinessScore: 76,
      status: "needs_attention",
    });
  });

  it("does not penalize info findings", () => {
    expect(calculateScore([finding("info")])).toEqual({
      readinessScore: 100,
      status: "ready",
    });
  });

  it("never returns a negative score", () => {
    const findings = Array.from({ length: 8 }, () => finding("critical"));

    expect(calculateScore(findings)).toEqual({
      readinessScore: 0,
      status: "not_ready",
    });
  });
});
