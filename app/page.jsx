"use client";

import { useState, useCallback, useEffect } from "react";
import { getAllPeople, computeKarma } from "@/lib/staleness";
import PRCard from "@/components/PRCard";
import KarmaFilterPanel from "@/components/KarmaFilterPanel";
import StatusChips from "@/components/StatusChips";
import GitHubSync from "@/components/GitHubSync";
import LoadingScreen from "@/components/LoadingScreen";

function LiveClock() {
  const now = new Date();
  return (
    <span style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", animation: "scanTick 1s step-start infinite" }}>
      ● LIVE {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
    </span>
  );
}

export default function Page() {
  const [prs, setPrs] = useState(null);
  const [authorFilters, setAuthorFilters] = useState(new Set());
  const [authorActionFilters, setAuthorActionFilters] = useState(new Set());
  const [reviewerFilters, setReviewerFilters] = useState(new Set());
  const [reviewerActionFilters, setReviewerActionFilters] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(null);
  const [syncState, setSyncState] = useState("idle");
  const [syncError, setSyncError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchPRs = useCallback(async () => {
    setSyncState("loading");
    setSyncError(null);
    try {
      const res = await fetch("/api/github/prs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch PRs");
      setPrs(data);
      setSyncState("success");
      setLastSynced(new Date());
    } catch (err) {
      setSyncError(err.message);
      setSyncState("error");
    }
  }, []);

  useEffect(() => {
    fetchPRs();
    const interval = setInterval(fetchPRs, 3 * 60 * 1000); // re-poll every 3 minutes
    return () => clearInterval(interval);
  }, [fetchPRs]);

  // Each button cycles: off → all → action-required → off
  const cycleAuthor = (name) => {
    if (authorActionFilters.has(name)) {
      setAuthorActionFilters((p) => { const n = new Set(p); n.delete(name); return n; });
    } else if (authorFilters.has(name)) {
      setAuthorFilters((p) => { const n = new Set(p); n.delete(name); return n; });
      setAuthorActionFilters((p) => new Set([...p, name]));
    } else {
      setAuthorFilters((p) => new Set([...p, name]));
    }
  };

  const cycleReviewer = (name) => {
    if (reviewerActionFilters.has(name)) {
      setReviewerActionFilters((p) => { const n = new Set(p); n.delete(name); return n; });
    } else if (reviewerFilters.has(name)) {
      setReviewerFilters((p) => { const n = new Set(p); n.delete(name); return n; });
      setReviewerActionFilters((p) => new Set([...p, name]));
    } else {
      setReviewerFilters((p) => new Set([...p, name]));
    }
  };

  if (prs === null) {
    return <LoadingScreen error={syncError} onRetry={fetchPRs} />;
  }

  const allPeople = getAllPeople(prs);
  const karma = computeKarma(allPeople, prs).sort((a, b) => b.blocking - a.blocking);

  const filteredPRs = prs
    .filter((pr) => {
      const authorOk =
        authorFilters.size === 0 && authorActionFilters.size === 0
          ? true
          : authorFilters.has(pr.author.name) ||
            (authorActionFilters.has(pr.author.name) &&
              pr.reviewers.some((r) => r.status === "changes_requested"));
      const reviewerOk =
        reviewerFilters.size === 0 && reviewerActionFilters.size === 0
          ? true
          : pr.reviewers.some((r) => reviewerFilters.has(r.name)) ||
            pr.reviewers.some(
              (r) =>
                reviewerActionFilters.has(r.name) &&
                (r.status === "pending" || r.status === "re_review_needed"),
            );
      const statusOk =
        !statusFilter ||
        (statusFilter === "pending" && pr.reviewers.some((r) => r.status === "pending")) ||
        (statusFilter === "re_review" && pr.reviewers.some((r) => r.status === "re_review_needed")) ||
        (statusFilter === "approved" && pr.reviewers.every((r) => r.status === "approved")) ||
        (statusFilter === "changes" && pr.reviewers.some((r) => r.status === "changes_requested")) ||
        (statusFilter === "stale" && pr.idleHours >= 48);
      return authorOk && reviewerOk && statusOk;
    })
    .sort((a, b) => b.idleHours - a.idleHours);

  const hasFilters = authorFilters.size > 0 || authorActionFilters.size > 0 || reviewerFilters.size > 0 || reviewerActionFilters.size > 0 || statusFilter !== null;

  const clearFilters = () => {
    setAuthorFilters(new Set());
    setAuthorActionFilters(new Set());
    setReviewerFilters(new Set());
    setReviewerActionFilters(new Set());
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

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <GitHubSync
              onRefresh={fetchPRs}
              syncState={syncState}
              syncError={syncError}
              lastSynced={lastSynced}
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
          authorActionFilters={authorActionFilters}
          reviewerFilters={reviewerFilters}
          reviewerActionFilters={reviewerActionFilters}
          onCycleAuthor={cycleAuthor}
          onCycleReviewer={cycleReviewer}
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
          <span style={{ color: "#818cf8" }}>● RE-REVIEW</span>{" "}
          <span style={{ color: "#475569" }}>● PENDING</span>
        </span>
        <span style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.2em" }}>
          ✏️ authored · 👁 reviewing — click to filter
        </span>
      </div>
    </div>
  );
}
