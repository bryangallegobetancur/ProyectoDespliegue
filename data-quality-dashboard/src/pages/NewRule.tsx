import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { RULE_TYPE_LABELS, type RuleType, type Severity } from "../types";

const RULE_TYPES = Object.keys(RULE_TYPE_LABELS) as RuleType[];

export function NewRule() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("NOT_NULL");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [tableName, setTableName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [minVal, setMinVal] = useState("");
  const [maxVal, setMaxVal] = useState("");
  const [allowedValues, setAllowedValues] = useState("");
  const [regexPattern, setRegexPattern] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const buildParams = (): Record<string, unknown> => {
    switch (ruleType) {
      case "RANGE":
        return {
          min: minVal ? Number(minVal) : undefined,
          max: maxVal ? Number(maxVal) : undefined,
        };
      case "VALUE_IN_SET":
        return { values: allowedValues.split(",").map((s) => s.trim()).filter(Boolean) };
      case "REGEX_MATCH":
        return { pattern: regexPattern };
      case "STRING_LENGTH":
        return {
          min: minVal ? Number(minVal) : undefined,
          max: maxVal ? Number(maxVal) : undefined,
        };
      case "CUSTOM_QUERY":
        return { query: customQuery };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("quality_rules").insert({
      user_id: user.id,
      name,
      description: description || null,
      rule_type: ruleType,
      severity,
      table_name: tableName,
      column_name: columnName || null,
      params: buildParams(),
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate("/rules");
    }
  };

  const needsColumn = !["CUSTOM_QUERY"].includes(ruleType);
  const needsMinMax = ["RANGE", "STRING_LENGTH"].includes(ruleType);
  const needsValues = ruleType === "VALUE_IN_SET";
  const needsPattern = ruleType === "REGEX_MATCH";
  const needsQuery = ruleType === "CUSTOM_QUERY";

  return (
    <div className="page">
      <h1>New Quality Rule</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-row">
          <label>
            Rule Name *
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Users email not null" />
          </label>
          <label>
            Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of what this rule checks"
            rows={2}
          />
        </label>

        <div className="form-row">
          <label>
            Rule Type *
            <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)}>
              {RULE_TYPES.map((rt) => (
                <option key={rt} value={rt}>{RULE_TYPE_LABELS[rt]}</option>
              ))}
            </select>
          </label>
          <label>
            Table Name *
            <input value={tableName} onChange={(e) => setTableName(e.target.value)} required placeholder="e.g. users" />
          </label>
        </div>

        {needsColumn && (
          <label>
            Column Name *
            <input value={columnName} onChange={(e) => setColumnName(e.target.value)} required placeholder="e.g. email" />
          </label>
        )}

        {needsMinMax && (
          <div className="form-row">
            <label>
              Min
              <input type="number" value={minVal} onChange={(e) => setMinVal(e.target.value)} />
            </label>
            <label>
              Max
              <input type="number" value={maxVal} onChange={(e) => setMaxVal(e.target.value)} />
            </label>
          </div>
        )}

        {needsValues && (
          <label>
            Allowed Values (comma-separated) *
            <input value={allowedValues} onChange={(e) => setAllowedValues(e.target.value)} placeholder="active, pending, inactive" />
          </label>
        )}

        {needsPattern && (
          <label>
            Regex Pattern *
            <input value={regexPattern} onChange={(e) => setRegexPattern(e.target.value)} placeholder="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" />
          </label>
        )}

        {needsQuery && (
          <label>
            Custom SQL Query *
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="SELECT * FROM table WHERE condition"
              rows={3}
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate("/rules")}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Rule"}
          </button>
        </div>
      </form>
    </div>
  );
}
