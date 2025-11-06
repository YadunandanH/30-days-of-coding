type Props = {
  label: string;
  value: string | number;
  helper?: string;
  accent?: "red" | "amber" | "green" | "blue";
};

const accentMap: Record<NonNullable<Props["accent"]>, { bg: string; color: string }> = {
  red: { bg: "#fee2e2", color: "#b91c1c" },
  amber: { bg: "#fef3c7", color: "#92400e" },
  green: { bg: "#dcfce7", color: "#047857" },
  blue: { bg: "#e0ecff", color: "#1f4d8f" },
};

export const KpiCard = ({ label, value, helper, accent = "blue" }: Props) => {
  const accentStyle = accentMap[accent];
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div
        className="tag"
        style={{
          background: accentStyle.bg,
          color: accentStyle.color,
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 700 }}>{value}</div>
      {helper && <p style={{ marginTop: "0.5rem" }}>{helper}</p>}
    </div>
  );
};
