import { useEffect, useState } from "react";
import { FaPhoneAlt, FaMapMarkedAlt, FaExclamationTriangle } from "react-icons/fa";

import { MapView } from "../components/MapView";
import { useRole } from "../context/RoleContext";
import { getApiClient } from "../services/api";

type SafeZone = {
  label: string;
  lat: number;
  lng: number;
  radius_km: number;
};

type SafetyPayload = {
  patient_id: number;
  sos_contact_chain: { name: string; phone: string }[];
  guide_me_home_url: string;
  last_known_location: { lat: number; lng: number };
  safe_zones: SafeZone[];
};

export const PatientSafety = () => {
  const { entityId } = useRole();
  const [data, setData] = useState<SafetyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSafety = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const { data } = await client.get<SafetyPayload>(`/patient/${entityId}/safety`);
        setData(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load safety dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchSafety();
  }, [entityId]);

  if (loading) {
    return <p>Loading safety tools…</p>;
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
        <h2><FaExclamationTriangle /> SOS</h2>
        <p>If you feel unsafe or lost, trigger SOS. We will call your caregiver immediately.</p>
        <button className="large-button" style={{ background: "#dc2626" }}>
          Tap to send SOS
        </button>
        <button className="large-button" style={{ marginTop: "0.75rem" }}>
          Share live location
        </button>
      </section>

      <section className="card">
        <h2><FaMapMarkedAlt /> Guide Me Home</h2>
        <p>Follow the big arrow to reach home safely.</p>
        <a href={data.guide_me_home_url} target="_blank" rel="noreferrer" className="large-button" style={{ display: "inline-flex", width: "auto" }}>
          Open directions
        </a>
        <div style={{ marginTop: "1rem" }}>
          <MapView center={data.last_known_location} safeZones={data.safe_zones} />
        </div>
      </section>

      <section className="card">
        <h2>Care circle</h2>
        <p>We will call contacts in this order:</p>
        <ol style={{ fontSize: "1.2rem", fontWeight: 600 }}>
          {data.sos_contact_chain.map((contact, index) => (
            <li key={contact.phone} style={{ marginBottom: "0.5rem" }}>
              {index + 1}. {contact.name} · <a href={`tel:${contact.phone}`}><FaPhoneAlt /> {contact.phone}</a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
