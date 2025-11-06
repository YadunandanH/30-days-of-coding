import { useEffect, useState } from "react";
import { FaExclamationCircle, FaClipboardList } from "react-icons/fa";

import { useRole } from "../context/RoleContext";
import { getApiClient } from "../services/api";

type Risk = {
  score: number;
  band: string;
  reasons: string[];
};

type TriageItem = {
  patient_id: number;
  patient_name: string;
  risk: Risk;
  next_milestone: string | null;
  action_recommendations: string[];
};

const badgeClass = (band: string) => {
  if (band === "red") return "status-red";
  if (band === "amber") return "status-amber";
  return "status-green";
};

export const HcpTriage = () => {
  const { entityId } = useRole();
  const [items, setItems] = useState<TriageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTriage = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const { data } = await client.get<TriageItem[]>(`/hcp/${entityId}/triage`);
        setItems(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load triage queue.");
      } finally {
        setLoading(false);
      }
    };
    fetchTriage();
  }, [entityId]);

  if (loading) {
    return <p>Loading triage dashboard…</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="cards-grid">
      {items.map((item) => (
        <section key={item.patient_id} className="card">
          <h2>{item.patient_name}</h2>
          <div className={`tag ${badgeClass(item.risk.band)}`}>Risk score {item.risk.score}</div>
          <h3 style={{ marginTop: "1rem" }}><FaExclamationCircle /> Why now</h3>
          <ul>
            {item.risk.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <h3><FaClipboardList /> Next milestone</h3>
          <p>{item.next_milestone ?? "All caught up"}</p>
          <div>
            <p style={{ fontWeight: 600 }}>Quick actions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {item.action_recommendations.map((action) => (
                <button key={action} className="large-button" style={{ width: "auto" }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};
