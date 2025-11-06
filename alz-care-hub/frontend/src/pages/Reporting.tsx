import { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { KpiCard } from "../components/KpiCard";
import { useRole } from "../context/RoleContext";
import { getApiClient } from "../services/api";

type KpiReport = {
  filters: Record<string, unknown>;
  kpis: {
    total_patients: number;
    avg_med_adherence_percent: number;
    avg_confirm_to_infusion_days: number;
    missed_appointments_last_30d: number;
    high_risk_patients: number;
    site_utilization_percent: Record<string, number>;
  };
  export_url: string;
};

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

export const Reporting = () => {
  const { entityId } = useRole();
  const [report, setReport] = useState<KpiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const { data } = await client.get<KpiReport>(`/reports/kpis`);
        setReport(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [entityId]);

  if (loading) {
    return <p>Preparing analytics…</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }
  if (!report) {
    return null;
  }

  const utilizationData = Object.entries(report.kpis.site_utilization_percent).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="cards-grid">
      <section className="card">
        <h2>Practice KPIs</h2>
        <div className="grid-three">
          <KpiCard label="Patients" value={report.kpis.total_patients} helper="Active" />
          <KpiCard label="Adherence" value={`${report.kpis.avg_med_adherence_percent}%`} accent="green" helper="Goal ≥ 85%" />
          <KpiCard label="Confirm → Infusion" value={`${report.kpis.avg_confirm_to_infusion_days} days`} accent="amber" />
        </div>
        <div className="grid-three" style={{ marginTop: "1rem" }}>
          <KpiCard label="Missed appointments" value={report.kpis.missed_appointments_last_30d} accent="red" helper="Last 30 days" />
          <KpiCard label="High risk" value={report.kpis.high_risk_patients} accent="red" helper="Needs triage" />
        </div>
        <a href={report.export_url} className="large-button" style={{ width: "auto", marginTop: "1rem" }}>
          <FaDownload /> Export CSV
        </a>
      </section>

      <section className="card">
        <h2>Site utilization</h2>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={utilizationData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120}>
                {utilizationData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul>
          {utilizationData.map((entry) => (
            <li key={entry.name}>
              {entry.name}: {entry.value}%
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
