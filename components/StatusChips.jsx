"use client";

import { getStaleness } from "@/lib/staleness";

const CHIPS = [
  { key: null, label: "ALL", color: "#94a3b8", filter: () => true },
  { key: "pending", label: "AWAITING REVIEW", color: "#facc15", filter: (pr) => pr.reviewers.some((r) => r.status === "pending") },
  { key: "re_review", label: "AWAITING RE-REVIEW", color: "#818cf8", filter: (pr) => pr.reviewers.some((r) => r.status === "re_review_needed") },
  { key: "approved", label: "APPROVED", color: "#4ade80", filter: (pr) => pr.reviewers.every((r) => r.status === "approved") },
  { key: "changes", label: "NEEDS CHANGES", color: "#f87171", filter: (pr) => pr.reviewers.some((r) => r.status === "changes_requested") },
  { key: "stale", label: "STALE 48h+", color: "#fb923c", filter: (pr) => getStaleness(pr) >= 48 },
];

export default function StatusChips({ prs, statusFilter, onSetFilter }) {
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
      {CHIPS.map((chip) => {
        const active = statusFilter === chip.key;
        const count = chip.key === null ? prs.length : prs.filter(chip.filter).length;
        return (
          <button
            key={chip.label}
            onClick={() => onSetFilter(active ? null : chip.key)}
            style={{
              background: active ? `${chip.color}22` : `${chip.color}0f`,
              border: `1px solid ${active ? chip.color : chip.color + "33"}`,
              borderRadius: 6,
              padding: "5px 10px",
              display: "flex",
              gap: 6,
              alignItems: "baseline",
              cursor: "pointer",
              boxShadow: active ? `0 0 10px ${chip.color}33` : "none",
              transition: "all 0.15s ease",
              outline: "none",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: chip.color, lineHeight: 1 }}>{count}</span>
            <span style={{ fontSize: 8, color: active ? chip.color : "#475569", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace" }}>
              {chip.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
