"use client";

import PixelAvatar from "./PixelAvatar";
import { formatWait } from "@/lib/formatters";

export default function KarmaFilterPanel({
  allPeople,
  karma,
  prs,
  authorFilters,
  authorActionFilters,
  reviewerFilters,
  reviewerActionFilters,
  onCycleAuthor,
  onCycleReviewer,
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
          // 0 = off, 1 = all, 2 = action-required only
          const authorStage = authorActionFilters.has(person.name) ? 2 : authorFilters.has(person.name) ? 1 : 0;
          const reviewerStage = reviewerActionFilters.has(person.name) ? 2 : reviewerFilters.has(person.name) ? 1 : 0;
          const isActive = authorStage > 0 || reviewerStage > 0;
          const isDevil = blocking > 0 && blocking >= blocked;
          const isAngel = blocked > 0 && blocked > blocking;
          const authored = authoredCount(person.name);
          const reviewing = reviewingCount(person.name);

          const authorBg    = authorStage === 2 ? "#2d1502" : authorStage === 1 ? `hsl(${person.hue}, 45%, 16%)` : "#080f1a";
          const authorBorder = authorStage === 2 ? "#fb923c88" : authorStage === 1 ? `hsl(${person.hue}, 55%, 32%)` : "#1e293b";
          const authorLabel  = authorStage === 2 ? "⚡ action" : "✏ author";
          const authorColor  = authorStage === 2 ? "#fb923c" : authorStage === 1 ? `hsl(${person.hue}, 65%, 62%)` : "#475569";
          const authorCount  = authorStage === 2 ? "#fb923c" : authorStage === 1 ? `hsl(${person.hue}, 80%, 70%)` : "#64748b";

          const reviewBg    = reviewerStage === 2 ? "#1a0a2e" : reviewerStage === 1 ? `hsl(${person.hue}, 45%, 16%)` : "#080f1a";
          const reviewBorder = reviewerStage === 2 ? "#818cf888" : reviewerStage === 1 ? `hsl(${person.hue}, 55%, 32%)` : "#1e293b";
          const reviewLabel  = reviewerStage === 2 ? "⚡ action" : "👁 review";
          const reviewColor  = reviewerStage === 2 ? "#818cf8" : reviewerStage === 1 ? `hsl(${person.hue}, 65%, 62%)` : "#475569";
          const reviewCount  = reviewerStage === 2 ? "#818cf8" : reviewerStage === 1 ? `hsl(${person.hue}, 80%, 70%)` : "#64748b";

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

              {/* Filter buttons — click to cycle: off → all → action required → off */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                <button
                  onClick={() => onCycleAuthor(person.name)}
                  title={authorStage === 0 ? `Show all PRs authored by ${person.name}` : authorStage === 1 ? `Filter to PRs needing ${person.name.split(" ")[0]}'s input` : `Clear author filter`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: authorBg, border: `1px solid ${authorBorder}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", transition: "all 0.12s ease" }}
                >
                  <span style={{ fontSize: 9, color: authorColor, fontFamily: "'DM Mono', monospace" }}>{authorLabel}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: authorCount, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{authored}</span>
                </button>

                <button
                  onClick={() => onCycleReviewer(person.name)}
                  title={reviewerStage === 0 ? `Show all PRs where ${person.name} is a reviewer` : reviewerStage === 1 ? `Filter to PRs requiring ${person.name.split(" ")[0]}'s review` : `Clear reviewer filter`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: reviewBg, border: `1px solid ${reviewBorder}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", transition: "all 0.12s ease" }}
                >
                  <span style={{ fontSize: 9, color: reviewColor, fontFamily: "'DM Mono', monospace" }}>{reviewLabel}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: reviewCount, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{reviewing}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
