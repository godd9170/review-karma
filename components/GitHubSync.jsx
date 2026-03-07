"use client";

import { useState, useEffect, useRef } from "react";

export default function GitHubSync({ onRefresh, syncState, syncError, lastSynced }) {
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!showPanel) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPanel]);

  const statusColor =
    syncState === "loading" ? "#facc15"
    : syncState === "error" ? "#f87171"
    : syncState === "success" ? "#4ade80"
    : "#334155";

  const statusIcon =
    syncState === "loading" ? "⟳"
    : syncState === "error" ? "✗"
    : syncState === "success" ? "✓"
    : "⚙";

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <button
        onClick={() => setShowPanel((v) => !v)}
        title={syncError || "GitHub sync"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: `${statusColor}14`,
          border: `1px solid ${statusColor}44`,
          borderRadius: 5,
          padding: "4px 8px",
          cursor: "pointer",
          color: statusColor,
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.1em",
        }}
      >
        <span style={{ fontSize: 11 }}>{statusIcon}</span>
        GITHUB
      </button>

      {showPanel && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: "#080f1a",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: 16,
            width: 220,
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace" }}>
            ◆ GITHUB SYNC
          </div>

          {syncError && (
            <div style={{ fontSize: 9, color: "#f87171", background: "#f8717114", border: "1px solid #f8717133", borderRadius: 5, padding: "6px 8px", fontFamily: "'DM Mono', monospace", wordBreak: "break-word" }}>
              {syncError}
            </div>
          )}

          <button
            onClick={() => { onRefresh(); setShowPanel(false); }}
            disabled={syncState === "loading"}
            style={{
              background: "#4ade8022",
              border: "1px solid #4ade8044",
              borderRadius: 5,
              padding: "6px 0",
              color: "#4ade80",
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.1em",
              cursor: syncState === "loading" ? "not-allowed" : "pointer",
              opacity: syncState === "loading" ? 0.5 : 1,
            }}
          >
            {syncState === "loading" ? "⟳ SYNCING..." : "↓ REFRESH"}
          </button>

          {lastSynced && (
            <div style={{ fontSize: 7, color: "#334155", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
              last synced {lastSynced.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
