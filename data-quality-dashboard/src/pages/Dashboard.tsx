import { StatsOverview } from "../components/StatsOverview";
import { RunHistory } from "../components/RunHistory";

export function Dashboard() {
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <StatsOverview />
      <RunHistory />
    </div>
  );
}
