import { createContext, useContext, useState, PropsWithChildren, useMemo } from "react";

export type Role = "patient" | "caregiver" | "hcp" | "hco_admin";

type RoleContextShape = {
  role: Role;
  setRole: (role: Role) => void;
  entityId: number;
  setEntityId: (id: number) => void;
};

const defaultRole: RoleContextShape = {
  role: "patient",
  setRole: () => undefined,
  entityId: 1,
  setEntityId: () => undefined,
};

const RoleContext = createContext<RoleContextShape>(defaultRole);

export const RoleProvider = ({ children }: PropsWithChildren) => {
  const [role, setRole] = useState<Role>("patient");
  const [entityId, setEntityId] = useState<number>(1);

  const value = useMemo(
    () => ({ role, setRole, entityId, setEntityId }),
    [role, entityId]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => useContext(RoleContext);
