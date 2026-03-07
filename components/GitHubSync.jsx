"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "review-karma-github-config";

const inputStyle = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 5,
  padding: "6px 8px",
  color: "#94a3b8",
  fontFamily: "'DM Mono', monospace",
  fontSize: 9,
  width: "100%",
  outline: "none",
};

export default function GitHubSync({ onConnect, onDisconnect, onRefresh, syncState, syncError, lastSynced, serverConfigured }) {
  const [showPanel, setShowPanel] = useState(false);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [pat, setPat] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const panelRef = useRef(null);

  // Load saved config on mount and auto-connect (only when not server-configured)
  useEffect(() => {
    if (serverConfigured) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setOwner(config.owner || "");
        setRepo(config.repo || "");
        setPat(config.pat || "");
        setIsConnected(true);
        onConnect(config);
      } catch {}
    }
  }, []);

  // Close panel on outside click
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

  const handleConnect = () => {
    if (!owner.trim() || !repo.trim() || !pat.trim()) return;
    const config = { owner: owner.trim(), repo: repo.trim(), pat: pat.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setIsConnected(true);
    setShowPanel(false);
    onConnect(config);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsConnected(false);
    setOwner("");
    setRepo("");
    setPat("");
    onDisconnect();
    setShowPanel(false);
  };

  const connected = serverConfigured || isConnected;
  const statusColor =
    syncState === "loading" ? "#facc15"
    : syncState === "error" ? "#f87171"
    : syncState === "success" ? "#4ade80"
    : "#334155";

  const statusIcon =
    syncState === "loading" ? "⟳"
    : syncState === "error" ? "✗"
    : connected ? "✓"
    : "⚙";

  const label = serverConfigured
    ? `${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}`
    : isConnected ? `${owner}/${repo}`
    : "CONNECT GITHUB";

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <button
        onClick={() => setShowPanel((v) => !v)}
        title={syncError || label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: connected ? `${statusColor}14` : "#0f172a",
          border: `1px solid ${connected ? statusColor + "44" : "#1e293b"}`,
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
        {label}
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
            width: 290,
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.15em", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
            ◆ GITHUB SYNC
          </div>

          {syncError && (
            <div style={{ fontSize: 9, color: "#f87171", background: "#f8717114", border: "1px solid #f8717133", borderRadius: 5, padding: "6px 8px", marginBottom: 10, fontFamily: "'DM Mono', monospace", wordBreak: "break-word" }}>
              {syncError}
            </div>
          )}

          {/* Server-configured: just show refresh, no PAT form */}
          {serverConfigured ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 8, color: "#334155", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
                Repo configured via environment variables.
              </div>
              <button
                onClick={() => { onRefresh(); setShowPanel(false); }}
                disabled={syncState === "loading"}
                style={{ background: "#4ade8022", border: "1px solid #4ade8044", borderRadius: 5, padding: "6px 0", color: "#4ade80", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", cursor: "pointer" }}
              >
                {syncState === "loading" ? "⟳ SYNCING..." : "↓ REFRESH"}
              </button>
              {lastSynced && (
                <div style={{ fontSize: 7, color: "#334155", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                  last synced {lastSynced.toLocaleTimeString()}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input placeholder="owner" value={owner} onChange={(e) => setOwner(e.target.value)} style={inputStyle} />
                <input placeholder="repo" value={repo} onChange={(e) => setRepo(e.target.value)} style={inputStyle} />
                <input
                  type="password"
                  placeholder="GitHub PAT (repo scope)"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  style={inputStyle}
                />
                <div style={{ fontSize: 7, color: "#1e293b", fontFamily: "'DM Mono', monospace", lineHeight: 1.5 }}>
                  Needs <code style={{ color: "#334155" }}>repo</code> scope. Stored in localStorage only.
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={handleConnect}
                  disabled={!owner || !repo || !pat || syncState === "loading"}
                  style={{ flex: 1, background: "#4ade8022", border: "1px solid #4ade8044", borderRadius: 5, padding: "6px 0", color: "#4ade80", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", cursor: "pointer", opacity: (!owner || !repo || !pat) ? 0.5 : 1 }}
                >
                  {syncState === "loading" ? "⟳ SYNCING..." : "↓ SYNC"}
                </button>
                {isConnected && (
                  <button
                    onClick={handleDisconnect}
                    style={{ background: "#f8717114", border: "1px solid #f8717133", borderRadius: 5, padding: "6px 10px", color: "#f87171", fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {lastSynced && (
                <div style={{ marginTop: 8, fontSize: 7, color: "#334155", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                  last synced {lastSynced.toLocaleTimeString()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
