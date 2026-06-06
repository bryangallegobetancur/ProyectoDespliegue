import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { SEVERITY_COLORS, type Severity } from "../types";

interface Stats {
  totalRules: number;
  activeRules: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  bySeverity: { severity: Severity; count: number }[];
  recentChecks: { date: string; passed: number; failed: number }[];
}

export function StatsOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;

    async function load() {
      const { data: rules } = await supabase
        .from("quality_rules")
        .select("id, is_active, severity")
        .eq("user_id", uid);

      const { data: checks } = await supabase
        .from("rule_checks")
        .select("status, rows_checked, rows_failed, started_at, rule_id")
        .eq("user_id", uid);

      if (!rules || !checks) return;

      const totalRules = rules.length;
      const activeRules = rules.filter((r) => r.is_active).length;
      const totalChecks = checks.length;
      const passedChecks = checks.filter((c) => c.status === "passed").length;
      const failedChecks = checks.filter((c) => c.status === "failed").length;

      const severityCount: Record<string, number> = {};
      rules.forEach((r) => {
        severityCount[r.severity] = (severityCount[r.severity] || 0) + 1;
      });
      const bySeverity = Object.entries(severityCount).map(([severity, count]) => ({
        severity: severity as Severity,
        count,
      }));

      const dayMap: Record<string, { passed: number; failed: number }> = {};
      checks.forEach((c) => {
        const day = c.started_at?.slice(0, 10) || "unknown";
        if (!dayMap[day]) dayMap[day] = { passed: 0, failed: 0 };
        if (c.status === "passed") dayMap[day].passed++;
        else if (c.status === "failed") dayMap[day].failed++;
      });
      const recentChecks = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([date, val]) => ({ date: date.slice(5), ...val }));

      setStats({ totalRules, activeRules, totalChecks, passedChecks, failedChecks, bySeverity, recentChecks });
    }

    load();
  }, [user]);

  if (!stats) {
    return <div className="card"><p>Loading stats...</p></div>;
  }

  const passRate = stats.totalChecks > 0
    ? Math.round((stats.passedChecks / stats.totalChecks) * 100)
    : 0;

  const severityData = stats.bySeverity.map((s) => ({
    name: s.severity,
    value: s.count,
    color: SEVERITY_COLORS[s.severity],
  }));

  return (
    <div className="stats-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.totalRules}</span>
          <span className="stat-label">Total Rules</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.activeRules}</span>
          <span className="stat-label">Active Rules</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalChecks}</span>
          <span className="stat-label">Total Checks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{passRate}%</span>
          <span className="stat-label">Pass Rate</span>
        </div>
      </div>

      <div className="charts-row">
        <div className="card">
          <h3>Rules by Severity</h3>
          {severityData.length === 0 ? (
            <p className="empty-text">No rules yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Checks (Last 7 days)</h3>
          {stats.recentChecks.length === 0 ? (
            <p className="empty-text">No checks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.recentChecks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="passed" fill="#22c55e" name="Passed" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
