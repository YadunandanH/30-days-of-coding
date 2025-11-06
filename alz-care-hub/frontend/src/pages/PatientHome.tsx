import { useEffect, useState } from "react";
import { FaPills, FaCalendarCheck, FaSmile, FaRoute, FaBell } from "react-icons/fa";

import { VoiceAssistantButton } from "../components/VoiceAssistantButton";
import { useRole } from "../context/RoleContext";
import { getApiClient } from "../services/api";

type Medication = {
  id: number;
  drug: string;
  dose: string;
  schedule: string;
};

type Appointment = {
  id: number;
  type: string;
  date_time: string;
  status: string;
  site_name?: string | null;
};

type VoicePrompt = {
  id: number;
  message: string;
  language: string;
};

type HomePayload = {
  patient_id: number;
  patient_name: string;
  next_medication: Medication | null;
  next_appointment: Appointment | null;
  mood_prompt: string;
  voice_prompts: VoicePrompt[];
  safety_quick_actions: { label: string; action: string }[];
};

export const PatientHome = () => {
  const { entityId } = useRole();
  const [data, setData] = useState<HomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHome = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const { data } = await client.get<HomePayload>(`/patient/${entityId}/home`);
        setData(data);
      } catch (err) {
        setError("Unable to load patient overview. Try refreshing.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHome();
  }, [entityId]);

  if (loading) {
    return <p>Loading today's plan…</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }
  if (!data) {
    return null;
  }

  const { next_medication, next_appointment, mood_prompt, voice_prompts, safety_quick_actions } = data;
  const primaryPrompt = voice_prompts[0]?.message ?? "Good day!";

  return (
    <div className="cards-grid">
      <section className="card">
        <h2><FaPills /> Next medication</h2>
        {next_medication ? (
          <div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{next_medication.drug}</p>
            <p>{next_medication.dose} · {next_medication.schedule}</p>
            <button className="large-button" style={{ marginTop: "1rem" }}>
              <FaBell /> I took it
            </button>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button className="large-button" style={{ background: "#fbbf24" }}>
                Snooze 10 min
              </button>
              <button className="large-button" style={{ background: "#ef4444" }}>
                Skip (tell us why)
              </button>
            </div>
          </div>
        ) : (
          <p>All doses complete for today!</p>
        )}
      </section>

      <section className="card">
        <h2><FaCalendarCheck /> Next appointment</h2>
        {next_appointment ? (
          <div>
            <p style={{ fontSize: "1.35rem", fontWeight: 700 }}>{next_appointment.type.toUpperCase()}</p>
            <p>{new Date(next_appointment.date_time).toLocaleString()}</p>
            {next_appointment.site_name && <p>Location: {next_appointment.site_name}</p>}
            <button className="large-button" style={{ marginTop: "1rem" }}>
              <FaRoute /> Guide me there
            </button>
          </div>
        ) : (
          <p>No upcoming appointments this week.</p>
        )}
      </section>

      <section className="card">
        <h2><FaSmile /> Mood check</h2>
        <p>{mood_prompt}</p>
        <div style={{ display: "flex", gap: "1rem", fontSize: "2.5rem" }}>
          <button className="large-button" style={{ width: "auto", padding: "0.5rem 1rem" }}>🙂</button>
          <button className="large-button" style={{ width: "auto", padding: "0.5rem 1rem" }}>😐</button>
          <button className="large-button" style={{ width: "auto", padding: "0.5rem 1rem" }}>☹️</button>
        </div>
        <VoiceAssistantButton message={primaryPrompt} label="Play greeting" />
      </section>

      <section className="card">
        <h2>Quick safety actions</h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {safety_quick_actions.map((action) => (
            <button key={action.action} className="large-button">
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
