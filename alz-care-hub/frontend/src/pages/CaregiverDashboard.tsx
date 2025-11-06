import { useEffect, useState } from "react";
import { FaBell, FaTasks, FaCalendarAlt } from "react-icons/fa";

import { useRole } from "../context/RoleContext";
import { getApiClient } from "../services/api";

type Alert = {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
  due_date: string | null;
};

type PatientCard = {
  patient_id: number;
  patient_name: string;
  adherence_percent: number;
  last_checkin?: string | null;
  upcoming_appointment?: string | null;
};

type DashboardPayload = {
  caregiver_id: number;
  caregiver_name: string;
  patients: PatientCard[];
  alerts: Alert[];
  shared_tasks: Task[];
};

export const CaregiverDashboard = () => {
  const { entityId } = useRole();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const { data } = await client.get<DashboardPayload>(`/caregiver/${entityId}/dashboard`);
        setData(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load caregiver dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [entityId]);

  if (loading) {
    return <p>Loading caregiver dashboard…</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }
  if (!data) {
    return null;
  }

  return (
    <div className="cards-grid">
      <section className="card">
        <h2>Patients today</h2>
        {data.patients.map((patient) => (
          <div key={patient.patient_id} style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e9f2" }}>
            <h3 style={{ margin: "0 0 0.3rem" }}>{patient.patient_name}</h3>
            <p>Adherence: <strong>{patient.adherence_percent}%</strong></p>
            {patient.last_checkin && <p>Last mood: {patient.last_checkin}</p>}
            {patient.upcoming_appointment && (
              <p>
                <FaCalendarAlt /> {new Date(patient.upcoming_appointment).toLocaleString()}
              </p>
            )}
            <button className="large-button" style={{ width: "auto" }}>Open care feed</button>
          </div>
        ))}
      </section>

      <section className="card">
        <h2><FaBell /> Alerts</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.alerts.map((alert) => (
            <li key={alert.id} style={{ marginBottom: "0.75rem" }}>
              <strong>{alert.type}</strong> — {new Date(alert.created_at).toLocaleTimeString()}<br />
              <small>{JSON.stringify(alert.payload)}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2><FaTasks /> Shared taskboard</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.shared_tasks.map((task) => (
            <li key={task.id} style={{ marginBottom: "0.75rem" }}>
              <strong>{task.title}</strong>
              <p>Status: {task.status}</p>
              {task.due_date && <p>Due: {new Date(task.due_date).toLocaleDateString()}</p>}
              <button className="large-button" style={{ width: "auto" }}>Mark done</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
