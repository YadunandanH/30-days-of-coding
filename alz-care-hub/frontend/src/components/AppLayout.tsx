import { PropsWithChildren } from "react";

export const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="app-shell">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 2rem",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 6px 18px rgba(19,41,75,0.08)",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "1rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Alzheimer's Care Hub
          </p>
          <h1 style={{ margin: "0.2rem 0 0", fontSize: "1.75rem" }}>Stay in sync. Keep care on track.</h1>
        </div>
        {children && Array.isArray(children) ? children[0] : null}
      </header>
      <main className="app-main">
        {children && Array.isArray(children) ? children.slice(1) : children}
      </main>
      <footer style={{ textAlign: "center", padding: "1rem 0", color: "#4a5d7b" }}>
        Built for quick demos · Offline-friendly · Multilingual ready
      </footer>
    </div>
  );
};
