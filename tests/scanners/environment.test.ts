import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { createProjectContext } from "../../src/core/fs.js";
import { scanLocalAgentEnvironment } from "../../src/scanners/environment.js";

describe("scanLocalAgentEnvironment", () => {
  it("emits info findings for supported local agent tools", async () => {
    const project = await createFixtureProject({ ".cursor/mcp.json": "{}" });
    const context = await createProjectContext(project.root);
    const findings = await scanLocalAgentEnvironment(context, {
      commandExists: async (command) => command === "codex",
    });

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "env.codex_detected",
        severity: "info",
        evidence: { command: "codex", detected: true },
      }),
      expect.objectContaining({
        ruleId: "env.claude_detected",
        severity: "info",
        evidence: { command: "claude", detected: false },
      }),
      expect.objectContaining({
        ruleId: "env.cursor_config_detected",
        severity: "info",
        evidence: { path: ".cursor/mcp.json", detected: true },
      }),
    ]));
  });
});
