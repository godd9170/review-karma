"use client";

import PixelAvatar from "./PixelAvatar";
import { formatWait } from "@/lib/formatters";

export default function KarmaFilterPanel({
  allPeople,
  karma,
  prs,
  authorFilters,
  reviewerFilters,
  onToggleAuthor,
  onToggleReviewer,
  onClear,
  hasFilters,
}) {
  const authoredCount = (name) => prs.filter((pr) => pr.author.name === name).length;
  const reviewingCount = (name) => prs.filter((pr) => pr.reviewers.some((r) => r.name === name)).length;

  return (
    <div style={{ marginTop: 16, background: "#080f1a", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 8, color: "#334155", letterSpacing: "0.18em", fontFamily: "'DM Mono', monospace" }}>
          ◆ TEAM KARMA
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {hasFilters && (
            <button
              onClick={onClear}
              style={{ background: "none", border: "1px solid #334155", borderRadius: 4, padding: "2px 8px", fontSize: 9, color: "#64748b", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", cursor: "pointer" }}
            >
              ✕ clear
            </button>
          )}
        </div>
      </div>

      <div className="karma-grid">
        {karma.map(({ person, blocking, blocked }) => {
          const isAuthorActive = authorFilters.has(person.name);
          const isReviewerActive = reviewerFilters.has(person.name);
          const isActive = isAuthorActive || isReviewerActive;
          const isDevil = blocking > 0 && blocking >= blocked;
          const isAngel = blocked > 0 && blocked > blocking;
          const authored = authoredCount(person.name);
          const reviewing = reviewingCount(person.name);

          return (
            <div
              key={person.name}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: isActive ? `hsl(${person.hue}, 30%, 9%)` : "#0d1929",
                border: `1px solid ${isActive ? `hsl(${person.hue}, 55%, 28%)` : "#1e293b"}`,
                borderRadius: 12,
                padding: "12px 10px 10px",
                minWidth: 96,
                transition: "all 0.15s ease",
                boxShadow: isActive ? `0 0 16px hsl(${person.hue},50%,20%)44` : "none",
              }}
            >
              {/* Avatar with halo or horns */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isAngel && (
                  <svg width="52" height="14" viewBox="0 0 52 14" style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", overflow: "visible", pointerEvents: "none" }}>
                    <ellipse cx="26" cy="7" rx="16" ry="5" fill="none" stroke="#fde68a" strokeWidth="2.5" opacity="0.9" style={{ filter: "drop-shadow(0 0 4px #fde68a)" }} />
                  </svg>
                )}
                {isDevil && (
                  <svg width="52" height="16" viewBox="0 0 52 16" style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", overflow: "visible", pointerEvents: "none" }}>
                    <path d="M 14 14 L 11 4 L 20 10 Z" fill="#f87171" opacity="0.92" style={{ filter: "drop-shadow(0 0 3px #f87171)" }} />
                    <path d="M 38 14 L 41 4 L 32 10 Z" fill="#f87171" opacity="0.92" style={{ filter: "drop-shadow(0 0 3px #f87171)" }} />
                  </svg>
                )}
                <PixelAvatar person={person} size={44} hoursWaiting={0} frame={0} />
              </div>

              {/* Name */}
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: `hsl(${person.hue}, 65%, 68%)`, textAlign: "center", lineHeight: 1.2 }}>
                {person.name.split(" ")[0]}
              </span>

              {/* Karma breakdown */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span
                  title={`${blocking}h sitting on pending reviews (holding others up)`}
                  style={{ fontSize: 10, color: blocking > 0 ? "#f87171cc" : "#334155", fontFamily: "'DM Mono', monospace" }}
                >
                  ⏳ {formatWait(blocking)}
                </span>
                <span
                  title={`${blocked}h waiting on reviewers (being held up)`}
                  style={{ fontSize: 10, color: blocked > 0 ? "#facc15cc" : "#334155", fontFamily: "'DM Mono', monospace" }}
                >
                  🕐 {formatWait(blocked)}
                </span>
              </div>

              {/* Filter buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                <button
                  onClick={() => onToggleAuthor(person.name)}
                  title={`Filter to PRs authored by ${person.name}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: isAuthorActive ? `hsl(${person.hue}, 45%, 16%)` : "#080f1a",
                    border: `1px solid ${isAuthorActive ? `hsl(${person.hue}, 55%, 32%)` : "#1e293b"}`,
                    borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: 9, color: isAuthorActive ? `hsl(${person.hue}, 65%, 62%)` : "#475569", fontFamily: "'DM Mono', monospace" }}>✏ author</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isAuthorActive ? `hsl(${person.hue}, 80%, 70%)` : "#64748b", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{authored}</span>
                </button>

                <button
                  onClick={() => onToggleReviewer(person.name)}
                  title={`Filter to PRs where ${person.name} is a reviewer`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: isReviewerActive ? `hsl(${person.hue}, 45%, 16%)` : "#080f1a",
                    border: `1px solid ${isReviewerActive ? `hsl(${person.hue}, 55%, 32%)` : "#1e293b"}`,
                    borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: 9, color: isReviewerActive ? `hsl(${person.hue}, 65%, 62%)` : "#475569", fontFamily: "'DM Mono', monospace" }}>👁 review</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isReviewerActive ? `hsl(${person.hue}, 80%, 70%)` : "#64748b", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{reviewing}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
