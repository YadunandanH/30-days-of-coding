import { useEffect, useState } from "react";
import { FaMap, FaChartLine } from "react-icons/fa";

import { MapView } from "../components/MapView";
import { KpiCard } from "../components/KpiCard";
import { useRole } from "../context/RoleContext";
import { getApiClient } from "../services/api";

type Site = {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  capacity: number;
  demand: number;
  wait_time: number;
};

type TerritorySnapshot = {
  sites: Site[];
  regional_summary: {
    total_sites: number;
    total_capacity: number;
    total_demand: number;
    utilization_percent: number;
  };
  bottlenecks: string[];
};

export const HcoTerritory = () => {
  const { entityId } = useRole();
  const [snapshot, setSnapshot] = useState<TerritorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const { data } = await client.get<TerritorySnapshot>(`/hco/${entityId}/territory`);
        setSnapshot(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load territory overview.");
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
  }, [entityId]);

  if (loading) {
    return <p>Loading territory insight…</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }
  if (!snapshot) {
    return null;
  }

  const center = snapshot.sites[0]
    ? { lat: Number(snapshot.sites[0].latitude), lng: Number(snapshot.sites[0].longitude) }
    : { lat: 12.9716, lng: 77.5946 };

  return (
    <div className="cards-grid">
      <section className="card">
        <h2><FaMap /> Territory map</h2>
        <MapView
          center={center}
          safeZones={snapshot.sites.map((site) => ({
            label: site.name,
            lat: Number(site.latitude),
            lng: Number(site.longitude),
            radius_km: Math.max(0.2, Math.min(1, site.demand / (site.capacity || 1))),
          }))}
        />
      </section>

      <section className="card">
        <h2><FaChartLine /> Utilization</h2>
        <div className="grid-three">
          <KpiCard label="Sites" value={snapshot.regional_summary.total_sites} accent="blue" />
          <KpiCard label="Capacity" value={snapshot.regional_summary.total_capacity} accent="green" helper="Total infusion slots" />
          <KpiCard label="Demand" value={snapshot.regional_summary.total_demand} accent="amber" helper="Active patients" />
        </div>
        <KpiCard label="Utilization" value={`${snapshot.regional_summary.utilization_percent}%`} accent="red" helper="Goal: under 80%" />
      </section>

      <section className="card">
        <h2>Bottlenecks</h2>
        {snapshot.bottlenecks.length ? (
          <ul>
            {snapshot.bottlenecks.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : (
          <p>All sites within safe thresholds.</p>
        )}
        <button className="large-button" style={{ width: "auto" }}>
          Suggest alternate sites
        </button>
      </section>
    </div>
  );
};
