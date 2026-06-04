import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { runCli } from "../../src/cli.js";

describe("agentpack fix --dry-run", () => {
  it("prints repair preview and does not write files", async () => {
    const project = await createFixtureProject({ ".env": "SECRET=hidden" });
    const writes: string[] = [];

    const exitCode = await runCli(["fix", "--dry-run"], {
      cwd: project.root,
      stdout: (text) => writes.push(text),
      stderr: (text) => writes.push(text),
    });

    expect(exitCode).toBe(0);
    expect(writes.join("")).toContain("Dry-run repair preview");
    expect(writes.join("")).toContain(".gitignore");
    expect(writes.join("")).not.toContain("SECRET=hidden");
  });

  it("rejects real fix in V0.1", async () => {
    const project = await createFixtureProject({});
    const writes: string[] = [];

    const exitCode = await runCli(["fix"], {
      cwd: project.root,
      stdout: (text) => writes.push(text),
      stderr: (text) => writes.push(text),
    });

    expect(exitCode).toBe(2);
    expect(writes.join("")).toContain("not supported in V0.1");
  });
});
