import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { createProjectContext } from "../../src/core/fs.js";
import { scanProjectReadiness } from "../../src/scanners/project-readiness.js";

async function scan(files: Record<string, string>) {
  const project = await createFixtureProject(files);
  const context = await createProjectContext(project.root);
  return scanProjectReadiness(context);
}

describe("scanProjectReadiness", () => {
  it("warns when no manifest exists", async () => {
    const findings = await scan({ "README.md": "# App" });

    expect(findings.map((finding) => finding.ruleId)).toContain("project.no_manifest");
  });

  it("recognizes package.json test, build, and lint scripts", async () => {
    const findings = await scan({
      "package.json": JSON.stringify({
        scripts: {
          test: "vitest run",
          build: "tsc",
          lint: "eslint .",
        },
      }),
    });

    expect(findings.map((finding) => finding.ruleId)).not.toContain("project.no_test_cmd");
    expect(findings.map((finding) => finding.ruleId)).not.toContain("project.no_build_lint");
  });

  it("warns when package.json has no test command", async () => {
    const findings = await scan({
      "package.json": JSON.stringify({ scripts: { dev: "vite" } }),
    });

    expect(findings.map((finding) => finding.ruleId)).toContain("project.no_test_cmd");
  });
});
