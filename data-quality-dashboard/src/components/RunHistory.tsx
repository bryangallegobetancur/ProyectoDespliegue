import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { RuleCheck } from "../types";

export function RunHistory() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<RuleCheck[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("rule_checks")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20);

      if (data) setChecks(data);
    };

    load();
  }, [user]);

  if (checks.length === 0) {
    return (
      <div className="card">
        <h3>Recent Runs</h3>
        <p className="empty-text">No checks executed yet. Click "Run Check" on a rule.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Recent Runs</h3>
      <div className="run-history-table-wrapper">
        <table className="run-history-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Checked</th>
              <th>Failed</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className={`status-badge ${c.status}`}>{c.status}</span>
                </td>
                <td>{c.rows_checked.toLocaleString()}</td>
                <td>{c.rows_failed > 0 ? c.rows_failed.toLocaleString() : "0"}</td>
                <td>{new Date(c.started_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
