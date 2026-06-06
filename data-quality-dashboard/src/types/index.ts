export type RuleType =
  | "NOT_NULL"
  | "UNIQUE"
  | "RANGE"
  | "VALUE_IN_SET"
  | "REGEX_MATCH"
  | "STRING_LENGTH"
  | "CUSTOM_QUERY";

export type Severity = "critical" | "high" | "medium" | "low";

export type CheckStatus = "running" | "passed" | "failed" | "error";

export interface QualityRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  rule_type: RuleType;
  severity: Severity;
  table_name: string;
  column_name: string | null;
  params: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RuleCheck {
  id: string;
  rule_id: string;
  user_id: string;
  status: CheckStatus;
  rows_checked: number;
  rows_failed: number;
  error_message: string | null;
  details: unknown[];
  started_at: string;
  finished_at: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  NOT_NULL: "Not Null",
  UNIQUE: "Unique",
  RANGE: "Range",
  VALUE_IN_SET: "Value in Set",
  REGEX_MATCH: "Regex Match",
  STRING_LENGTH: "String Length",
  CUSTOM_QUERY: "Custom Query",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};
