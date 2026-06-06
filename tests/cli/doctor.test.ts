import { describe, expect, it } from "vitest";
import { pathToFileURL } from "node:url";
import { createFixtureProject } from "../helpers/project.js";
import { runDoctor } from "../../src/index.js";
import { isDirectCliExecution, runCli } from "../../src/cli.js";
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

    expect(output).toContain("agentpack doctor v0.1.1");
    expect(output).toContain("Status: NOT_READY");
    expect(output).toContain("Security Boundaries");
    expect(output).toContain("Top 3 Actions");
    expect(output).toContain("evidence: .env");
    expect(output).not.toContain('{"path"');
  });
});

describe("runCli", () => {
  it("recognizes npm .bin symlink as direct cli execution", async () => {
    const project = await createFixtureProject({
      "package/dist/cli.js": "",
      "package/.bin/agentpack": "",
    });

    const distPath = `${project.root}/package/dist/cli.js`;
    const binPath = `${project.root}/package/.bin/agentpack`;
    await import("node:fs/promises").then(async ({ rm, symlink }) => {
      await rm(binPath);
      await symlink("../dist/cli.js", binPath);
    });

    expect(isDirectCliExecution(pathToFileURL(distPath).href, binPath)).toBe(true);
  });

  it("returns exit code 0 for top-level help", async () => {
    const project = await createFixtureProject({});
    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = await runCli(["--help"], {
      cwd: project.root,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Usage: agentpack");
    expect(stderr.join("")).toBe("");
  });

  it("returns exit code 1 in ci mode when critical findings exist", async () => {
    const project = await createFixtureProject({ ".env": "SECRET=hidden" });
    const writes: string[] = [];

    const exitCode = await runCli(["doctor", "--ci"], {
      cwd: project.root,
      stdout: (text) => writes.push(text),
      stderr: (text) => writes.push(text),
    });

    expect(exitCode).toBe(1);
    expect(writes.join("")).toContain("NOT_READY");
  });

  it("returns JSON only for doctor --json", async () => {
    const project = await createFixtureProject({ "AGENTS.md": "Run: npm run dev\nTest: npm test\nDo not read: .env\nRead first: README.md" });
    const writes: string[] = [];

    const exitCode = await runCli(["doctor", "--json"], {
      cwd: project.root,
      stdout: (text) => writes.push(text),
      stderr: (text) => writes.push(text),
    });

    expect(exitCode).toBe(0);
    expect(() => JSON.parse(writes.join(""))).not.toThrow();
  });

  it("returns exit code 2 for invalid --only value", async () => {
    const project = await createFixtureProject({});
    const writes: string[] = [];

    const exitCode = await runCli(["doctor", "--only", "models"], {
      cwd: project.root,
      stdout: (text) => writes.push(text),
      stderr: (text) => writes.push(text),
    });

    expect(exitCode).toBe(2);
    expect(writes.join("")).toContain("Invalid --only value");
  });
});
