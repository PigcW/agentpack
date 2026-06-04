import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { createProjectContext } from "../../src/core/fs.js";
import { scanAgentContext } from "../../src/scanners/agent-context.js";

async function scan(files: Record<string, string>) {
  const project = await createFixtureProject(files);
  const context = await createProjectContext(project.root);
  return scanAgentContext(context);
}

describe("scanAgentContext", () => {
  it("reports a critical finding when no Agent entry file exists", async () => {
    const findings = await scan({ "package.json": "{}" });

    expect(findings.map((finding) => finding.ruleId)).toContain("context.no_entry_file");
    expect(findings.find((finding) => finding.ruleId === "context.no_entry_file")?.severity).toBe("critical");
  });

  it("does not report missing commands when AGENTS.md documents run and test commands", async () => {
    const findings = await scan({
      "AGENTS.md": [
        "# AGENTS",
        "Read first: README.md",
        "Run: npm run dev",
        "Test: npm test",
        "Do not read: .env, 13pwd/",
      ].join("\n"),
      "README.md": "# App",
    });

    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.missing_run_cmd");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.missing_test_cmd");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.no_deny_rules");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.no_read_first");
  });

  it("reports missing README and weak Agent guidance", async () => {
    const findings = await scan({ "AGENTS.md": "# Agent notes" });

    expect(findings.map((finding) => finding.ruleId)).toEqual(expect.arrayContaining([
      "context.no_readme",
      "context.missing_run_cmd",
      "context.missing_test_cmd",
      "context.no_deny_rules",
      "context.no_read_first",
    ]));
  });

  it("reads guidance from .cursor/rules entry directories", async () => {
    const findings = await scan({
      ".cursor/rules/agent.md": [
        "Read first: README.md",
        "Run: npm run dev",
        "Test: npm test",
        "Do not read: .env",
      ].join("\n"),
      "README.md": "# App",
    });

    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.no_entry_file");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.missing_run_cmd");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.missing_test_cmd");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.no_deny_rules");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("context.no_read_first");
  });
});
