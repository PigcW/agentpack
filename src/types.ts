export type Severity = "critical" | "warning" | "info";

export type FindingStatus = "fail" | "pass";

export type Category =
  | "agent_context"
  | "mcp_health"
  | "security_boundaries"
  | "local_agent_environment"
  | "project_readiness";

export type RunMode = "full" | "security" | "mcp";

export type ReadinessStatus = "ready" | "needs_attention" | "not_ready";

export interface Finding {
  ruleId: string;
  category: Category;
  severity: Severity;
  status: FindingStatus;
  message: string;
  evidence: Record<string, string | string[] | number | boolean>;
  recommendedAction: string;
}

export interface ScoreResult {
  readinessScore: number;
  status: ReadinessStatus;
}

export interface CategorySummary {
  pass: number;
  warning: number;
  critical: number;
  info: number;
}

export interface TopAction {
  rank: number;
  ruleId: string;
  severity: Severity;
  summary: string;
}

export interface DoctorReport {
  agentpackVersion: string;
  scannedPath: string;
  mode: RunMode;
  readinessScore: number;
  status: ReadinessStatus;
  categories: Record<Category, CategorySummary>;
  findings: Finding[];
  topActions: TopAction[];
  categoryScoped: boolean;
}

export interface ScanOptions {
  projectRoot: string;
  mode: RunMode;
}
