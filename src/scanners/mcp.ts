import { parse as parseToml } from "smol-toml";
import type { CommandDetector } from "../core/commands.js";
import { defaultCommandDetector } from "../core/commands.js";
import type { ProjectContext } from "../core/fs.js";
import { RULES, type RuleId } from "../rules.js";
import type { Finding } from "../types.js";

const MCP_CONFIG_FILES = [".mcp.json", ".cursor/mcp.json", ".codex/config.toml"];
const RISKY_COMMAND_PATTERNS = [/\bbash\b/, /\bsh\b/, /\bsudo\b/, /rm\s+-rf/, /curl\s+.*\|\s*sh/];
const SECRET_ARGUMENT_NAME = String.raw`(?:token|api[-_]?key|secret|password|auth[-_]?token|access[-_]?token|client[-_]?secret)`;
const SECRET_ARGUMENT_VALUE = String.raw`(?:"[^"]*"|'[^']*'|\S+)`;

interface McpServer {
  name: string;
  command: string;
  args: string[];
  source: string;
  fingerprint: string;
}

export async function scanMcpHealth(
  context: ProjectContext,
  detector: CommandDetector = defaultCommandDetector,
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const servers: McpServer[] = [];

  for (const configPath of MCP_CONFIG_FILES.filter((path) => context.hasFile(path))) {
    const raw = await context.readText(configPath);
    const duplicates = findDuplicateServerNames(raw);

    for (const duplicate of duplicates) {
      findings.push(createFinding("mcp.duplicate_server", {
        config_path: configPath,
        server_name: duplicate,
      }));
    }

    try {
      servers.push(...parseMcpServers(configPath, raw));
    } catch (error) {
      findings.push(createFinding("mcp.invalid_format", {
        config_path: configPath,
        parser_error: "Invalid MCP config syntax",
        parser_location: extractParserLocation(error),
      }));
    }
  }

  findings.push(...findCrossToolConflicts(servers));

  for (const server of servers) {
    if (server.command && !(await detector.commandExists(server.command))) {
      findings.push(createFinding("mcp.missing_command", {
        server_name: server.name,
        command: server.command,
        config_path: server.source,
      }));
    }

    const commandLine = [server.command, ...server.args].join(" ");
    if (RISKY_COMMAND_PATTERNS.some((pattern) => pattern.test(commandLine))) {
      findings.push(createFinding("mcp.risky_stdio", {
        server_name: server.name,
        command_fragment: sanitizeCommand(commandLine),
        config_path: server.source,
      }));
    }
  }

  return findings;
}

function parseMcpServers(configPath: string, raw: string): McpServer[] {
  if (configPath.endsWith(".toml")) {
    const parsed = parseToml(raw) as Record<string, unknown>;
    const source = parsed.mcp_servers ?? parsed.mcpServers ?? {};
    return normalizeServers(configPath, source);
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return normalizeServers(configPath, parsed.mcpServers ?? {});
}

function normalizeServers(configPath: string, source: unknown): McpServer[] {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return [];
  }

  return Object.entries(source as Record<string, unknown>).map(([name, value]) => {
    const record = value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
    const command = typeof record.command === "string" ? record.command : "";
    const args = Array.isArray(record.args) ? record.args.filter((arg): arg is string => typeof arg === "string") : [];

    return {
      name,
      command,
      args,
      source: configPath,
      fingerprint: JSON.stringify({ command, args }),
    };
  });
}

function findDuplicateServerNames(raw: string): string[] {
  const mcpServersMatch = raw.match(/"mcpServers"\s*:\s*\{([\s\S]*)\}\s*\}?\s*$/);
  if (!mcpServersMatch) {
    return [];
  }

  const names = [...mcpServersMatch[1].matchAll(/"([^"]+)"\s*:\s*\{/g)].map((match) => match[1]);
  return names.filter((name, index) => names.indexOf(name) !== index);
}

function findCrossToolConflicts(servers: McpServer[]): Finding[] {
  const findings: Finding[] = [];
  const byName = new Map<string, McpServer[]>();

  for (const server of servers) {
    byName.set(server.name, [...(byName.get(server.name) ?? []), server]);
  }

  for (const [name, namedServers] of byName) {
    const fingerprints = new Set(namedServers.map((server) => server.fingerprint));
    if (fingerprints.size > 1) {
      findings.push(createFinding("mcp.cross_tool_conflict", {
        server_name: name,
        config_paths: namedServers.map((server) => server.source),
      }));
    }
  }

  return findings;
}

function sanitizeCommand(commandLine: string): string {
  let sanitized = commandLine;
  sanitized = sanitized.replace(new RegExp(String.raw`\b(Authorization:\s*Bearer)\s+${SECRET_ARGUMENT_VALUE}`, "gi"), "$1 <redacted>");
  sanitized = sanitized.replace(new RegExp(String.raw`\b(Bearer)\s+${SECRET_ARGUMENT_VALUE}`, "gi"), "$1 <redacted>");
  sanitized = sanitized.replace(new RegExp(String.raw`(\b${SECRET_ARGUMENT_NAME}=)${SECRET_ARGUMENT_VALUE}`, "gi"), "$1<redacted>");
  sanitized = sanitized.replace(new RegExp(String.raw`(^|\s)(--${SECRET_ARGUMENT_NAME})(=)${SECRET_ARGUMENT_VALUE}`, "gi"), "$1$2$3<redacted>");
  sanitized = sanitized.replace(new RegExp(String.raw`(^|\s)(--${SECRET_ARGUMENT_NAME})(\s+)${SECRET_ARGUMENT_VALUE}`, "gi"), "$1$2$3<redacted>");
  return sanitized;
}

function extractParserLocation(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lineColumn = message.match(/line \d+ column \d+/i);
  if (lineColumn) {
    return lineColumn[0];
  }

  const tomlLine = message.match(/\n\s*\d+:/);
  if (tomlLine) {
    return `line ${tomlLine[0].replace(/\D/g, "")}`;
  }

  return "unknown";
}

function createFinding(ruleId: RuleId, evidence: Finding["evidence"]): Finding {
  const rule = RULES[ruleId];
  return {
    ruleId: rule.ruleId,
    category: rule.category,
    severity: rule.severity,
    status: "fail",
    message: rule.message,
    evidence,
    recommendedAction: rule.recommendedAction,
  };
}
