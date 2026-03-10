"use client";

import PixelAvatar from "./PixelAvatar";

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
          <span style={{ fontSize: 7, color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
            ✏️ authored · 👁 reviewing
          </span>
          {hasFilters && (
            <button
              onClick={onClear}
              style={{ background: "none", border: "1px solid #334155", borderRadius: 4, padding: "2px 8px", fontSize: 7, color: "#64748b", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", cursor: "pointer" }}
            >
              ✕ clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {karma.map(({ person, blocking, blocked }) => {
          const isAuthorActive = authorFilters.has(person.name);
          const isReviewerActive = reviewerFilters.has(person.name);
          const isActive = isAuthorActive || isReviewerActive;
          const net = blocked - blocking;
          const netColor = net < -20 ? "#f87171" : net > 20 ? "#facc15" : "#94a3b8";
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
                gap: 5,
                background: isActive ? `hsl(${person.hue}, 30%, 10%)` : "transparent",
                border: `1px solid ${isActive ? `hsl(${person.hue}, 60%, 30%)` : "#1e293b"}`,
                borderRadius: 10,
                padding: "10px 10px 8px",
                minWidth: 76,
                transition: "all 0.15s ease",
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
              <span style={{ fontSize: 7, fontFamily: "'DM Mono', monospace", color: `hsl(${person.hue}, 65%, 62%)`, textAlign: "center", lineHeight: 1.2 }}>
                {person.name.split(" ")[0]}
              </span>

              {/* Karma breakdown: blocking hours / blocked hours */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {blocking > 0 && (
                  <span
                    title={`${blocking}h sitting on pending reviews (holding others up)`}
                    style={{ fontSize: 10, color: "#f87171bb", fontFamily: "'DM Mono', monospace" }}
                  >
                    ⏳ −{blocking}h
                  </span>
                )}
                {blocked > 0 && (
                  <span
                    title={`${blocked}h waiting on reviewers (being held up)`}
                    style={{ fontSize: 10, color: "#facc15bb", fontFamily: "'DM Mono', monospace" }}
                  >
                    🕐 +{blocked}h
                  </span>
                )}
              </div>

              {/* Filter buttons */}
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => onToggleAuthor(person.name)}
                  title={`Show PRs authored by ${person.name}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 3,
                    background: isAuthorActive ? `hsl(${person.hue}, 45%, 18%)` : "#0f172a",
                    border: `1px solid ${isAuthorActive ? `hsl(${person.hue}, 60%, 40%)` : "#1e293b"}`,
                    borderRadius: 5, padding: "3px 6px", cursor: "pointer",
                    boxShadow: isAuthorActive ? `0 0 8px hsl(${person.hue},60%,30%)55` : "none",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: 9 }}>✏️</span>
                  <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, color: isAuthorActive ? `hsl(${person.hue}, 80%, 65%)` : "#475569", fontFamily: "'DM Mono', monospace" }}>
                    {authored}
                  </span>
                </button>

                <button
                  onClick={() => onToggleReviewer(person.name)}
                  title={`Show PRs where ${person.name} is a reviewer`}
                  style={{
                    display: "flex", alignItems: "center", gap: 3,
                    background: isReviewerActive ? `hsl(${person.hue}, 45%, 18%)` : "#0f172a",
                    border: `1px solid ${isReviewerActive ? `hsl(${person.hue}, 60%, 40%)` : "#1e293b"}`,
                    borderRadius: 5, padding: "3px 6px", cursor: "pointer",
                    boxShadow: isReviewerActive ? `0 0 8px hsl(${person.hue},60%,30%)55` : "none",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: 9 }}>👁</span>
                  <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, color: isReviewerActive ? `hsl(${person.hue}, 80%, 65%)` : "#475569", fontFamily: "'DM Mono', monospace" }}>
                    {reviewing}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
