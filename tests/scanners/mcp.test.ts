import { describe, expect, it } from "vitest";
import { createFixtureProject } from "../helpers/project.js";
import { createProjectContext } from "../../src/core/fs.js";
import { scanMcpHealth } from "../../src/scanners/mcp.js";

async function scan(files: Record<string, string>) {
  const project = await createFixtureProject(files);
  const context = await createProjectContext(project.root);
  return scanMcpHealth(context, { commandExists: async () => false });
}

describe("scanMcpHealth", () => {
  it("reports invalid JSON config as critical", async () => {
    const findings = await scan({ ".mcp.json": "{ invalid json" });

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "mcp.invalid_format",
        severity: "critical",
      }),
    ]));
  });

  it("reports duplicate server names in raw JSON", async () => {
    const findings = await scan({
      ".mcp.json": `{
        "mcpServers": {
          "github": { "command": "npx", "args": ["a"] },
          "github": { "command": "npx", "args": ["b"] }
        }
      }`,
    });

    expect(findings.map((finding) => finding.ruleId)).toContain("mcp.duplicate_server");
  });

  it("reports cross-tool conflicts for the same server name", async () => {
    const findings = await scan({
      ".mcp.json": JSON.stringify({
        mcpServers: {
          github: { command: "npx", args: ["server-a"] },
        },
      }),
      ".cursor/mcp.json": JSON.stringify({
        mcpServers: {
          github: { command: "npx", args: ["server-b"] },
        },
      }),
    });

    expect(findings.map((finding) => finding.ruleId)).toContain("mcp.cross_tool_conflict");
  });

  it("reports risky stdio command patterns", async () => {
    const findings = await scan({
      ".mcp.json": JSON.stringify({
        mcpServers: {
          shell: { command: "bash", args: ["-lc", "rm -rf /tmp/example"] },
        },
      }),
    });

    expect(findings.map((finding) => finding.ruleId)).toContain("mcp.risky_stdio");
  });

  it("does not leak TOML parser source snippets that contain secret-like values", async () => {
    const findings = await scan({
      ".codex/config.toml": [
        "[mcp_servers.shell]",
        "command = \"token=SECRET123\"",
        "invalid = [",
      ].join("\n"),
    });

    expect(findings.map((finding) => finding.ruleId)).toContain("mcp.invalid_format");
    expect(JSON.stringify(findings)).not.toContain("SECRET123");
  });

  it("parses TOML MCP config for cross-tool conflicts", async () => {
    const findings = await scan({
      ".mcp.json": JSON.stringify({
        mcpServers: {
          github: { command: "npx", args: ["server-a"] },
        },
      }),
      ".codex/config.toml": [
        "[mcp_servers.github]",
        "command = \"npx\"",
        "args = [\"server-b\"]",
      ].join("\n"),
    });

    expect(findings.map((finding) => finding.ruleId)).toContain("mcp.cross_tool_conflict");
  });
});
