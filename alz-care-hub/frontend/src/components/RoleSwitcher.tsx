import { useState } from "react";
import { FaHeartbeat, FaUserMd, FaUserShield, FaHandsHelping } from "react-icons/fa";

import { Role, useRole } from "../context/RoleContext";
import { getAdminId, getCaregiverId, getHcpId, getPatientId } from "../services/api";

type Option = {
  value: Role;
  label: string;
  icon: JSX.Element;
};

const roleOptions: Option[] = [
  { value: "patient", label: "Patient", icon: <FaHeartbeat /> },
  { value: "caregiver", label: "Caregiver", icon: <FaHandsHelping /> },
  { value: "hcp", label: "HCP", icon: <FaUserMd /> },
  { value: "hco_admin", label: "HCO Admin", icon: <FaUserShield /> },
];

export const RoleSwitcher = () => {
  const { role, setRole, setEntityId } = useRole();
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (option: Option) => {
    setRole(option.value);
    switch (option.value) {
      case "patient":
        setEntityId(getPatientId());
        break;
      case "caregiver":
        setEntityId(getCaregiverId());
        break;
      case "hcp":
        setEntityId(getHcpId());
        break;
      case "hco_admin":
        setEntityId(getAdminId());
        break;
      default:
        break;
    }
    setExpanded(false);
  };

  const active = roleOptions.find((option) => option.value === role) ?? roleOptions[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        className="large-button"
        style={{ minWidth: "240px", justifyContent: "space-between" }}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-haspopup="listbox"
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
          {active.icon}
          {active.label}
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      {expanded && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            listStyle: "none",
            margin: 0,
            padding: "0.5rem",
            background: "white",
            borderRadius: "14px",
            boxShadow: "0 12px 28px rgba(19,41,75,0.1)",
            minWidth: "220px",
            zIndex: 10,
          }}
        >
          {roleOptions.map((option) => (
            <li key={option.value}>
              <button
                onClick={() => handleSelect(option)}
                style={{
                  width: "100%",
                  border: "none",
                  background: option.value === role ? "#e6f0ff" : "transparent",
                  borderRadius: "12px",
                  padding: "0.75rem 1rem",
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {option.icon}
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
