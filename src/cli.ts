#!/usr/bin/env node
import { Command } from "commander";
import { pathToFileURL } from "node:url";
import { renderDryRunFix } from "./fix/dry-run.js";
import { runDoctor } from "./index.js";
import { renderJsonReport } from "./report/json.js";
import { renderTerminalReport } from "./report/terminal.js";
import type { RunMode } from "./types.js";

export interface CliIO {
  cwd: string;
  stdout(text: string): void;
  stderr(text: string): void;
}

export async function runCli(argv: string[], io: CliIO): Promise<number> {
  const program = new Command();
  let exitCode = 0;

  program
    .name("agentpack")
    .exitOverride()
    .configureOutput({
      writeOut: (text) => io.stdout(text),
      writeErr: (text) => io.stderr(text),
    });

  program
    .command("doctor")
    .option("--json", "Output valid JSON only")
    .option("--ci", "Use automation-friendly output and exit codes")
    .option("--only <category>", "Run only one category: security or mcp")
    .action(async (options: { json?: boolean; ci?: boolean; only?: string }) => {
      const mode = parseMode(options.only);
      if (!mode) {
        io.stderr("Invalid --only value. Supported values: security, mcp\n");
        exitCode = 2;
        return;
      }

      const report = await runDoctor({ projectRoot: io.cwd, mode });
      io.stdout(options.json ? renderJsonReport(report) : renderTerminalReport(report));

      if (options.ci && report.findings.some((finding) => finding.status === "fail" && finding.severity === "critical")) {
        exitCode = 1;
      }
    });

  program
    .command("fix")
    .option("--dry-run", "Preview repair actions without writing files")
    .action(async (options: { dryRun?: boolean }) => {
      if (!options.dryRun) {
        io.stdout("agentpack fix writes are not supported in V0.1. Run agentpack fix --dry-run to preview repair actions.\n");
        exitCode = 2;
        return;
      }

      const report = await runDoctor({ projectRoot: io.cwd, mode: "full" });
      io.stdout(renderDryRunFix(report));
    });

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (error) {
    io.stderr(error instanceof Error ? `${error.message}\n` : `${String(error)}\n`);
    return 2;
  }

  return exitCode;
}

function parseMode(only?: string): RunMode | null {
  if (!only) {
    return "full";
  }

  if (only === "security") {
    return "security";
  }

  if (only === "mcp") {
    return "mcp";
  }

  return null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2), {
    cwd: process.cwd(),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  }).then((code) => {
    process.exitCode = code;
  });
}
