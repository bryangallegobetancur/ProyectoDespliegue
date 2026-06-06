import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { RULE_TYPE_LABELS, SEVERITY_COLORS, type QualityRule } from "../types";
import type { CheckStatus } from "../types";

interface Props {
  rule: QualityRule;
  onRunComplete: () => void;
}

export function RuleCard({ rule, onRunComplete }: Props) {
  const { user } = useAuth();

  const handleRun = async () => {
    if (!user) return;

    const { data: check, error } = await supabase
      .from("rule_checks")
      .insert({
        rule_id: rule.id,
        user_id: user.id,
        status: "running",
      })
      .select()
      .single();

    if (error || !check) {
      console.error("Failed to create check run:", error);
      return;
    }

    let status: CheckStatus = "passed";
    let rowsChecked = 0;
    let rowsFailed = 0;
    let errorMessage: string | null = null;
    const details: Record<string, unknown>[] = [];

    try {
      const { data: rawData, error: queryError } = await supabase
        .from(rule.table_name)
        .select(rule.column_name || "*");

      if (queryError) throw new Error(queryError.message);

      const rows = (rawData || []) as unknown as Record<string, unknown>[];
      rowsChecked = rows.length;

      const col = rule.column_name || "id";

      let valueFreq: Map<string, number> | null = null;
      if (rule.rule_type === "UNIQUE") {
        valueFreq = new Map();
        for (const row of rows) {
          const v = String(row[col] ?? "");
          valueFreq.set(v, (valueFreq.get(v) || 0) + 1);
        }
      }

      for (const row of rows) {
        const value = rule.column_name ? row[rule.column_name] : undefined;
        let failed = false;
        let reason = "";

        switch (rule.rule_type) {
          case "NOT_NULL": {
            if (value === null || value === undefined || value === "") {
              failed = true;
              reason = "Value is null or empty";
            }
            break;
          }
          case "UNIQUE": {
            const v = String(row[col] ?? "");
            if ((valueFreq?.get(v) || 0) > 1) {
              failed = true;
              reason = `Duplicate value "${v}" found in column ${col}`;
            }
            break;
          }
          case "RANGE": {
            const p = rule.params as { min?: number; max?: number };
            const num = Number(value);
            if (p.min !== undefined && num < p.min) {
              failed = true;
              reason = `Value ${num} is below minimum ${p.min}`;
            }
            if (p.max !== undefined && num > p.max) {
              failed = true;
              reason = `Value ${num} exceeds maximum ${p.max}`;
            }
            break;
          }
          case "VALUE_IN_SET": {
            const allowed = (rule.params as { values?: string[] }).values || [];
            if (!allowed.includes(String(value))) {
              failed = true;
              reason = `Value "${value}" not in allowed set`;
            }
            break;
          }
          case "REGEX_MATCH": {
            const pattern = (rule.params as { pattern?: string }).pattern || "";
            if (!new RegExp(pattern).test(String(value))) {
              failed = true;
              reason = `Value "${value}" does not match pattern`;
            }
            break;
          }
          case "STRING_LENGTH": {
            const p = rule.params as { min?: number; max?: number };
            const len = String(value).length;
            if (p.min !== undefined && len < p.min) {
              failed = true;
              reason = `Length ${len} is below minimum ${p.min}`;
            }
            if (p.max !== undefined && len > p.max) {
              failed = true;
              reason = `Length ${len} exceeds maximum ${p.max}`;
            }
            break;
          }
          case "CUSTOM_QUERY": {
            const sql = (rule.params as { query?: string }).query || "";
            if (sql) {
              const { error: customErr } = await supabase.rpc("exec_sql", { query: sql });
              if (customErr) {
                failed = true;
                reason = customErr.message;
              }
            }
            break;
          }
        }

        if (failed) {
          rowsFailed++;
          const allKeys = Object.keys(row);
          details.push({
            row_id: (row.id as string) ?? (row[allKeys[0]] as string),
            column: rule.column_name,
            value,
            reason,
          });
        }
      }

      if (rowsFailed > 0) status = "failed";
    } catch (err: unknown) {
      status = "error";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    await supabase
      .from("rule_checks")
      .update({
        status,
        rows_checked: rowsChecked,
        rows_failed: rowsFailed,
        error_message: errorMessage,
        details,
        finished_at: new Date().toISOString(),
      })
      .eq("id", check.id);

    onRunComplete();
  };

  return (
    <div className="rule-card">
      <div className="rule-card-header">
        <div className="rule-card-title-row">
          <h3>{rule.name}</h3>
          <span
            className="severity-badge"
            style={{ backgroundColor: SEVERITY_COLORS[rule.severity] }}
          >
            {rule.severity}
          </span>
        </div>
        <span className="rule-type-badge">{RULE_TYPE_LABELS[rule.rule_type]}</span>
      </div>
      {rule.description && <p className="rule-desc">{rule.description}</p>}
      <div className="rule-meta">
        <span>Table: <strong>{rule.table_name}</strong></span>
        {rule.column_name && <span>Column: <strong>{rule.column_name}</strong></span>}
        <span className={`status-dot ${rule.is_active ? "active" : "inactive"}`}>
          {rule.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      <button onClick={handleRun} className="btn btn-primary btn-sm">
        Run Check
      </button>
    </div>
  );
}
