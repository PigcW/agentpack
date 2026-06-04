import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { createProjectContext } from "../../src/core/fs.js";
import { scanSecurityBoundaries } from "../../src/scanners/security.js";

async function scan(files: Record<string, string>) {
  const project = await createFixtureProject(files);
  const context = await createProjectContext(project.root);
  return scanSecurityBoundaries(context);
}

describe("scanSecurityBoundaries", () => {
  it("reports .env as critical when not ignored", async () => {
    const findings = await scan({
      "AGENTS.md": "Do not read: nothing sensitive yet",
      ".env": "SECRET=hidden",
    });

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "security.secret_not_ignored",
        severity: "critical",
        evidence: { path: ".env", rule_checked: ".gitignore" },
      }),
    ]));
    expect(JSON.stringify(findings)).not.toContain("SECRET=hidden");
  });

  it("does not report ignored secret files as critical", async () => {
    const findings = await scan({
      ".gitignore": ".env\n",
      "AGENTS.md": "Do not read: .env",
      ".env": "SECRET=hidden",
    });

    expect(findings.map((finding) => finding.ruleId)).not.toContain("security.secret_not_ignored");
  });

  it("warns when sensitive files are not denied in Agent rules", async () => {
    const findings = await scan({
      ".gitignore": ".env\n",
      "AGENTS.md": "Run: npm run dev",
      ".env": "SECRET=hidden",
    });

    expect(findings.map((finding) => finding.ruleId)).toContain("security.secret_not_denied");
  });

  it("warns when sensitive directories are exposed", async () => {
    const findings = await scan({
      "AGENTS.md": "Run: npm run dev",
      "secrets/example.txt": "do not print me",
    });

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "security.sensitive_dir_exposed",
        evidence: expect.objectContaining({ path: "secrets" }),
      }),
    ]));
    expect(JSON.stringify(findings)).not.toContain("do not print me");
  });
});
