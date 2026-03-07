"use client";

import { useState, useCallback, useEffect } from "react";

const SERVER_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER;
const SERVER_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO;
import { MOCK_PRS } from "@/lib/mockData";
import { getStaleness, getAllPeople, computeKarma } from "@/lib/staleness";
import PRCard from "@/components/PRCard";
import KarmaFilterPanel from "@/components/KarmaFilterPanel";
import StatusChips from "@/components/StatusChips";
import GitHubSync from "@/components/GitHubSync";

function LiveClock() {
  const now = new Date();
  return (
    <span style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", animation: "scanTick 1s step-start infinite" }}>
      ● LIVE {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
    </span>
  );
}

export default function Page() {
  const [prs, setPrs] = useState(MOCK_PRS);
  const [usingMockData, setUsingMockData] = useState(true);
  const [authorFilters, setAuthorFilters] = useState(new Set());
  const [reviewerFilters, setReviewerFilters] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(null);
  const [syncState, setSyncState] = useState("idle");
  const [syncError, setSyncError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchPRs = useCallback(async (config = {}) => {
    setSyncState("loading");
    setSyncError(null);
    try {
      const owner = config.owner || SERVER_OWNER;
      const repo = config.repo || SERVER_REPO;
      const headers = config.pat ? { Authorization: `Bearer ${config.pat}` } : {};
      const res = await fetch(
        `/api/github/prs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
        { headers },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch PRs");
      setPrs(data);
      setUsingMockData(false);
      setSyncState("success");
      setLastSynced(new Date());
    } catch (err) {
      setSyncError(err.message);
      setSyncState("error");
    }
  }, []);

  const handleConnect = useCallback((config) => fetchPRs(config), [fetchPRs]);

  // Auto-fetch on load when env vars are pre-configured server-side
  useEffect(() => {
    if (SERVER_OWNER && SERVER_REPO && !localStorage.getItem("review-karma-github-config")) {
      fetchPRs();
    }
  }, [fetchPRs]);

  const handleDisconnect = useCallback(() => {
    setPrs(MOCK_PRS);
    setUsingMockData(true);
    setSyncState("idle");
    setSyncError(null);
    setLastSynced(null);
  }, []);

  const toggle = (setFn, name) => {
    setFn((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const allPeople = getAllPeople(prs);
  const karma = computeKarma(allPeople, prs).sort((a, b) => b.blocking - a.blocking);

  const filteredPRs = prs
    .filter((pr) => {
      const authorOk = authorFilters.size === 0 || authorFilters.has(pr.author.name);
      const reviewerOk = reviewerFilters.size === 0 || pr.reviewers.some((r) => reviewerFilters.has(r.name));
      const statusOk =
        !statusFilter ||
        (statusFilter === "pending" && pr.reviewers.some((r) => r.status === "pending")) ||
        (statusFilter === "approved" && pr.reviewers.every((r) => r.status === "approved")) ||
        (statusFilter === "changes" && pr.reviewers.some((r) => r.status === "changes_requested")) ||
        (statusFilter === "stale" && getStaleness(pr) >= 48);
      return authorOk && reviewerOk && statusOk;
    })
    .sort((a, b) => getStaleness(b) - getStaleness(a));

  const hasFilters = authorFilters.size > 0 || reviewerFilters.size > 0 || statusFilter !== null;

  const clearFilters = () => {
    setAuthorFilters(new Set());
    setReviewerFilters(new Set());
    setStatusFilter(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020c14",
        backgroundImage: `
          radial-gradient(ellipse at 20% 0%, #0c2a1a 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, #1a0a2e 0%, transparent 50%)
        `,
        padding: "28px 20px 40px",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto 20px" }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1
            style={{
              fontFamily: "'Silkscreen', monospace",
              fontSize: 22,
              color: "#e2e8f0",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            REVIEW KARMA
          </h1>
          <span style={{ fontSize: 10, color: "#334155", letterSpacing: "0.2em" }}>◆ PR QUEUE ◆</span>
          {usingMockData && (
            <span
              style={{
                fontSize: 8,
                color: "#334155",
                letterSpacing: "0.1em",
                border: "1px solid #1e293b",
                borderRadius: 4,
                padding: "2px 6px",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              DEMO DATA
            </span>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <GitHubSync
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onRefresh={() => fetchPRs()}
              syncState={syncState}
              syncError={syncError}
              lastSynced={lastSynced}
              serverConfigured={!!(SERVER_OWNER && SERVER_REPO)}
            />
            <LiveClock />
          </div>
        </div>

        <StatusChips prs={prs} statusFilter={statusFilter} onSetFilter={setStatusFilter} />

        <KarmaFilterPanel
          allPeople={allPeople}
          karma={karma}
          prs={prs}
          authorFilters={authorFilters}
          reviewerFilters={reviewerFilters}
          onToggleAuthor={(name) => toggle(setAuthorFilters, name)}
          onToggleReviewer={(name) => toggle(setReviewerFilters, name)}
          onClear={clearFilters}
          hasFilters={hasFilters}
        />
      </div>

      {/* PR grid */}
      <div className="grid">
        {filteredPRs.length > 0 ? (
          filteredPRs.map((pr, i) => <PRCard key={pr.id} pr={pr} index={i} />)
        ) : (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 0",
              color: "#334155",
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.15em",
            }}
          >
            ◌ NO MATCHING PRs
            <div style={{ fontSize: 9, marginTop: 6, color: "#1e293b" }}>adjust filters above</div>
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div
        style={{
          maxWidth: 1100,
          margin: "24px auto 0",
          borderTop: "1px solid #1e293b",
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.2em" }}>
          REVIEWER RINGS: <span style={{ color: "#4ade80" }}>● APPROVED</span>{" "}
          <span style={{ color: "#f87171" }}>● CHANGES</span>{" "}
          <span style={{ color: "#475569" }}>● PENDING</span>
        </span>
        <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.2em" }}>
          ✏️ authored · 👁 reviewing — click to filter
        </span>
      </div>
    </div>
  );
}
