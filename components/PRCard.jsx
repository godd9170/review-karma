"use client";

import { useState, useEffect } from "react";
import PixelAvatar from "./PixelAvatar";
import SizeChip from "./SizeChip";
import { getStaleness, getBlockedBy } from "@/lib/staleness";
import { formatWait, getMoodColor, getCardBg, getAnimClass } from "@/lib/formatters";

const LINEAR_SLUG = process.env.NEXT_PUBLIC_LINEAR_SLUG;
const LINEAR_RE = /\bLL-\d+\b/g;

function linearUrl(issueId) {
  return LINEAR_SLUG
    ? `https://linear.app/${LINEAR_SLUG}/issue/${issueId}`
    : `https://linear.app/issue/${issueId}`;
}

function TitleWithLinear({ title }) {
  const parts = [];
  let last = 0;
  for (const m of title.matchAll(LINEAR_RE)) {
    if (m.index > last) parts.push(title.slice(last, m.index));
    parts.push(
      <a
        key={m.index}
        href={linearUrl(m[0])}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ color: "#818cf8", textDecoration: "none", borderBottom: "1px solid #818cf855" }}
      >
        {m[0]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < title.length) parts.push(title.slice(last));
  return <>{parts}</>;
}

function getStatusInfo(pr) {
  if (pr.reviewers.every((r) => r.status === "approved")) {
    return { text: "approved", emoji: "✅", color: "#4ade80", bg: "#4ade8014", border: "#4ade8033" };
  }
  if (pr.reviewers.some((r) => r.status === "changes_requested") && pr.reviewers.every((r) => r.status !== "pending")) {
    return { text: "changes needed", emoji: "🔁", color: "#fb923c", bg: "#fb923c14", border: "#fb923c33" };
  }
  if (pr.reviewers.some((r) => r.status === "pending")) {
    return { text: "awaiting review", emoji: "👀", color: "#facc15", bg: "#facc1514", border: "#facc1533" };
  }
  return { text: "pending", emoji: "⏳", color: "#94a3b8", bg: "#94a3b814", border: "#94a3b833" };
}

export default function PRCard({ pr, index }) {
  const staleness = getStaleness(pr);
  const moodColor = getMoodColor(staleness);
  const cardBg = getCardBg(staleness);
  const anim = getAnimClass(staleness);
  const statusInfo = getStatusInfo(pr);

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % 4), 650 + index * 110);
    return () => clearInterval(t);
  }, [index]);

  const allApproved = pr.reviewers.every((r) => r.status === "approved");
  const hasChanges = pr.reviewers.some((r) => r.status === "changes_requested");

  const titleContent = (
    <div
      style={{
        fontSize: 11,
        color: "#cbd5e1",
        lineHeight: 1.4,
        fontFamily: "'DM Mono', monospace",
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}
    >
      <TitleWithLinear title={pr.title} />
    </div>
  );

  return (
    <div
      className={`pr-card ${anim}`}
      style={{
        background: `linear-gradient(135deg, ${cardBg} 0%, #0f172a 100%)`,
        border: `1px solid ${moodColor}33`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 20px ${moodColor}15, inset 0 1px 0 ${moodColor}22`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 30px ${moodColor}35, inset 0 1px 0 ${moodColor}22`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 20px ${moodColor}15, inset 0 1px 0 ${moodColor}22`)}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: 12,
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Top row: author avatar + title + diff */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <PixelAvatar person={pr.author} size={50} hoursWaiting={staleness} frame={frame} />
          <span style={{ fontSize: 7, color: `hsl(${pr.author.hue}, 70%, 60%)`, fontFamily: "'DM Mono', monospace", maxWidth: 50, textAlign: "center", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pr.author.name.split(" ")[0]}
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          {/* Title — link if we have a GitHub URL */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            {pr.url ? (
              <a href={pr.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
                {titleContent}
              </a>
            ) : (
              titleContent
            )}
          </div>

          {/* Size + diff stats + status pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SizeChip size={pr.size} />
            <span style={{ fontSize: 9, color: "#4ade80", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>+{pr.additions}</span>
            <span style={{ fontSize: 9, color: "#f87171", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>−{pr.deletions}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 8, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", borderRadius: 4, padding: "2px 6px", flexShrink: 0, color: statusInfo.color, background: statusInfo.bg, border: `1px solid ${statusInfo.border}` }}>
              {statusInfo.emoji} {statusInfo.text}
            </span>
          </div>

          {/* Time row */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${moodColor}14`, border: `1px solid ${moodColor}33`, borderRadius: 5, padding: "3px 7px" }}>
              <span style={{ fontSize: 8, color: moodColor, opacity: 0.7, letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace" }}>idle</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: moodColor, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{formatWait(staleness)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 5, padding: "3px 7px" }}>
              <span style={{ fontSize: 8, color: "#475569", letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace" }}>opened</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{formatWait(pr.openedHours)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Branch row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 9, color: "#475569", fontFamily: "'DM Mono', monospace", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, padding: "2px 6px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          ⎇ {pr.branch}
        </span>
        {pr.comments > 0 && (
          <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
            💬 {pr.comments}
          </span>
        )}
      </div>

      {/* Reviewers */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 8, color: "#334155", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>REVIEWERS</span>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {pr.reviewers.map((r, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <PixelAvatar person={r} size={32} ring={r.status} />
              <span style={{ fontSize: 6, color: "#475569", fontFamily: "'DM Mono', monospace", maxWidth: 32, textAlign: "center", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        {allApproved && (
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#4ade80", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", border: "1px solid #4ade8044", borderRadius: 4, padding: "1px 5px", animation: "glowGreen 2s ease-in-out infinite" }}>
            ✓ READY
          </span>
        )}
        {hasChanges && !allApproved && (
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#f87171", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", border: "1px solid #f8717144", borderRadius: 4, padding: "1px 5px" }}>
            ✗ CHANGES
          </span>
        )}
      </div>
    </div>
  );
}
