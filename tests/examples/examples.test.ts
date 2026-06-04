import { describe, expect, it } from "vitest";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runDoctor } from "../../src/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("example projects", () => {
  it("marks clean project ready or needs_attention without critical findings", async () => {
    const report = await runDoctor({
      projectRoot: resolve(root, "examples/clean-project"),
      mode: "full",
    });

    expect(report.findings.some((finding) => finding.severity === "critical" && finding.status === "fail")).toBe(false);
    expect(["ready", "needs_attention"]).toContain(report.status);
  });

  it("marks risky project not_ready with critical findings", async () => {
    const report = await runDoctor({
      projectRoot: resolve(root, "examples/risky-project"),
      mode: "full",
    });

    expect(report.status).toBe("not_ready");
    expect(report.findings.some((finding) => finding.severity === "critical" && finding.status === "fail")).toBe(true);
  });
});
