import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { Icon } from "leaflet";

import "leaflet/dist/leaflet.css";

type SafeZone = {
  label: string;
  lat: number;
  lng: number;
  radius_km: number;
};

type Props = {
  center: { lat: number; lng: number };
  safeZones?: SafeZone[];
};

const markerIcon = new Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const MapView = ({ center, safeZones = [] }: Props) => {
  return (
    <div style={{ height: "320px", borderRadius: "20px", overflow: "hidden" }}>
      <MapContainer center={[center.lat, center.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[center.lat, center.lng]} icon={markerIcon} />
        {safeZones.map((zone) => (
          <Circle
            key={`${zone.label}-${zone.lat}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius_km * 1000}
            pathOptions={{ color: "#1f7aec", fillColor: "#1f7aec", fillOpacity: 0.1 }}
          />
        ))}
      </MapContainer>
    </div>
  );
};
