import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { RuleCard } from "../components/RuleCard";
import type { QualityRule } from "../types";

export function Rules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<QualityRule[]>([]);
  const [filter, setFilter] = useState("all");

  const loadRules = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("quality_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setRules(data);
  };

  useEffect(() => {
    loadRules();
  }, [user]);

  const filtered = filter === "all" ? rules : filter === "active"
    ? rules.filter((r) => r.is_active)
    : rules.filter((r) => !r.is_active);

  return (
    <div className="page">
      <div className="page-header-row">
        <h1>Quality Rules</h1>
        <div className="filter-tabs">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <p className="empty-text">
            {rules.length === 0
              ? "No rules yet. Create your first quality rule!"
              : "No rules match the selected filter."}
          </p>
        </div>
      ) : (
        <div className="rules-grid">
          {filtered.map((rule) => (
            <RuleCard key={rule.id} rule={rule} onRunComplete={loadRules} />
          ))}
        </div>
      )}
    </div>
  );
}
