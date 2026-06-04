import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { runDoctor } from "../../src/index.js";
import { renderJsonReport } from "../../src/report/json.js";
import { renderTerminalReport } from "../../src/report/terminal.js";

describe("runDoctor", () => {
  it("returns full not_ready report for a risky project", async () => {
    const project = await createFixtureProject({
      ".env": "SECRET=hidden",
      "package.json": JSON.stringify({ scripts: { dev: "vite" } }),
    });

    const report = await runDoctor({ projectRoot: project.root, mode: "full" });

    expect(report.status).toBe("not_ready");
    expect(report.findings.map((finding) => finding.ruleId)).toContain("context.no_entry_file");
    expect(report.findings.map((finding) => finding.ruleId)).toContain("security.secret_not_ignored");
    expect(report.topActions[0].severity).toBe("critical");
  });

  it("runs only security checks in security mode", async () => {
    const project = await createFixtureProject({
      ".env": "SECRET=hidden",
      "package.json": "{}",
    });

    const report = await runDoctor({ projectRoot: project.root, mode: "security" });

    expect(report.categoryScoped).toBe(true);
    expect(new Set(report.findings.map((finding) => finding.category))).toEqual(new Set(["security_boundaries"]));
  });

  it("renders JSON without ANSI text or secret values", async () => {
    const project = await createFixtureProject({ ".env": "SECRET=hidden" });
    const report = await runDoctor({ projectRoot: project.root, mode: "security" });
    const json = renderJsonReport(report);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).not.toContain("\u001b[");
    expect(json).not.toContain("SECRET=hidden");
  });

  it("renders terminal output with score, status, categories, and top actions", async () => {
    const project = await createFixtureProject({ ".env": "SECRET=hidden" });
    const report = await runDoctor({ projectRoot: project.root, mode: "security" });
    const output = renderTerminalReport(report);

    expect(output).toContain("agentpack doctor v0.1.0");
    expect(output).toContain("Status: NOT_READY");
    expect(output).toContain("Security Boundaries");
    expect(output).toContain("Top 3 Actions");
  });
});
