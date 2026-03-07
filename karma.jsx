import { useState, useEffect } from "react";

// openedHours      = total age of the PR
// lastActivityHours = hours since last meaningful event (push, review, comment)
// Staleness is derived from these — see getStaleness()
const MOCK_PRS = [
  {
    id: 1,
    title: "feat: add OAuth2 refresh token rotation",
    branch: "feat/oauth-refresh",
    openedHours: 72,
    lastActivityHours: 60, // Tom still hasn't reviewed — stuck for 60h
    author: { name: "Maya Chen", initials: "MC", hue: 210, seed: 1 },
    reviewers: [
      {
        name: "Tom Walsh",
        initials: "TW",
        hue: 340,
        seed: 3,
        status: "pending",
      },
      {
        name: "Sara Kim",
        initials: "SK",
        hue: 130,
        seed: 4,
        status: "approved",
      },
    ],
    comments: 4,
    size: "L",
    additions: 312,
    deletions: 48,
  },
  {
    id: 2,
    title: "fix: memory leak in websocket handler",
    branch: "fix/ws-memory",
    openedHours: 48,
    lastActivityHours: 6, // Maya left changes_requested 6h ago — fresh action, Dev just needs to respond
    author: { name: "Dev Patel", initials: "DP", hue: 45, seed: 2 },
    reviewers: [
      {
        name: "Maya Chen",
        initials: "MC",
        hue: 210,
        seed: 1,
        status: "changes_requested",
      },
    ],
    comments: 9,
    size: "S",
    additions: 23,
    deletions: 71,
  },
  {
    id: 3,
    title: "chore: upgrade webpack to v5.98",
    branch: "chore/webpack-v5",
    openedHours: 5,
    lastActivityHours: 5, // freshly opened
    author: { name: "Tom Walsh", initials: "TW", hue: 340, seed: 3 },
    reviewers: [
      {
        name: "Dev Patel",
        initials: "DP",
        hue: 45,
        seed: 2,
        status: "pending",
      },
      {
        name: "Rina Mori",
        initials: "RM",
        hue: 280,
        seed: 5,
        status: "pending",
      },
    ],
    comments: 1,
    size: "M",
    additions: 89,
    deletions: 12,
  },
  {
    id: 4,
    title: "feat: dark mode system preference sync",
    branch: "feat/dark-mode",
    openedHours: 38,
    lastActivityHours: 32, // both approved 32h ago, author hasn't merged
    author: { name: "Sara Kim", initials: "SK", hue: 130, seed: 4 },
    reviewers: [
      {
        name: "Tom Walsh",
        initials: "TW",
        hue: 340,
        seed: 3,
        status: "approved",
      },
      {
        name: "Dev Patel",
        initials: "DP",
        hue: 45,
        seed: 2,
        status: "approved",
      },
    ],
    comments: 2,
    size: "M",
    additions: 156,
    deletions: 34,
  },
  {
    id: 5,
    title: "refactor: extract auth middleware",
    branch: "refactor/auth-mw",
    openedHours: 96,
    lastActivityHours: 90, // completely silent for 90h
    author: { name: "Rina Mori", initials: "RM", hue: 280, seed: 5 },
    reviewers: [
      {
        name: "Sara Kim",
        initials: "SK",
        hue: 130,
        seed: 4,
        status: "pending",
      },
    ],
    comments: 0,
    size: "XL",
    additions: 487,
    deletions: 203,
  },
];

// Staleness = how long since anyone has needed to act, based on who has the ball.
// A fresh "changes requested" isn't stale — the reviewer acted, it's the author's turn now,
// and the clock resets to lastActivityHours.
function getStaleness(pr) {
  return pr.lastActivityHours;
}

function getBlockedBy(pr) {
  const allActed = pr.reviewers.every((r) => r.status !== "pending");
  if (!allActed) return "reviewers";
  if (pr.reviewers.every((r) => r.status === "approved")) return "merge"; // ready to land
  return "author"; // changes requested, waiting on author
}

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getTraits(seed) {
  const r = seededRand(seed * 999 + 7);
  const skinTones = [
    "#FDDBB4",
    "#F5C28A",
    "#E8A96A",
    "#C68642",
    "#8D5524",
    "#FFDFC4",
  ];
  const hairColors = [
    "#1a0a00",
    "#3b1f0a",
    "#6b3a2a",
    "#c49a3c",
    "#e8c97e",
    "#a0522d",
    "#4a4a4a",
    "#111827",
  ];
  return {
    skin: skinTones[Math.floor(r() * skinTones.length)],
    hair: hairColors[Math.floor(r() * hairColors.length)],
    hairStyle: Math.floor(r() * 5),
    accessory: [null, "glasses", "headband", "earring", "cap"][
      Math.floor(r() * 5)
    ],
    eyeColor: ["#2c4a7c", "#3a7c2c", "#7c3a2c", "#222", "#5a3a7c"][
      Math.floor(r() * 5)
    ],
    hasBeard: r() > 0.72,
    faceShape: Math.floor(r() * 3),
  };
}

function PixelAvatar({
  person,
  size = 40,
  hoursWaiting = 0,
  frame = 0,
  ring = null,
}) {
  const traits = getTraits(person.seed);
  const moodColor =
    hoursWaiting < 8
      ? "#4ade80"
      : hoursWaiting < 24
        ? "#a3e635"
        : hoursWaiting < 48
          ? "#facc15"
          : hoursWaiting < 72
            ? "#fb923c"
            : "#f87171";

  const ringColor =
    ring === "approved"
      ? "#4ade80"
      : ring === "changes_requested"
        ? "#f87171"
        : ring === "pending"
          ? "#64748b"
          : null;

  const eyeY = hoursWaiting > 48 ? 18 : 17;
  const eyeSize = hoursWaiting > 72 ? 3 : 2.2;
  const isBlink = frame === 3;
  const showSweat = hoursWaiting >= 48;
  const showAnger = hoursWaiting >= 72;

  const getMouthPath = () => {
    if (hoursWaiting < 8) return "M 13 24 Q 16 27.5 19 24";
    if (hoursWaiting < 24) return "M 13 24 Q 16 26 19 24";
    if (hoursWaiting < 48) return "M 13 24 L 19 24";
    if (hoursWaiting < 72) return "M 13 25 Q 16 23 19 25";
    return "M 12 26 Q 16 22 20 26";
  };

  const hairPaths = [
    `M 8 11 Q 16 4 24 11 L 24 14 Q 16 7 8 14 Z`,
    `M 7 13 Q 10 4 16 5 Q 22 4 25 13 L 25 16 Q 22 8 16 9 Q 10 8 7 16 Z`,
    `M 7 13 Q 10 3 16 4 Q 22 3 25 13 L 26 27 Q 24 20 24 14 Q 16 8 8 14 L 6 27 Q 6 20 7 13 Z`,
    `M 9 14 Q 7 7 12 6 Q 14 3 16 4 Q 18 3 20 6 Q 25 7 23 14 Q 20 8 16 7 Q 12 8 9 14 Z`,
    `M 7 14 Q 9 4 18 5 Q 24 5 25 13 L 25 16 Q 20 7 14 8 Q 9 9 8 16 Z M 7 14 L 5 19 Q 6 15 8 16 Z`,
  ];

  return (
    <div
      style={{ position: "relative", display: "inline-block", flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        style={{
          display: "block",
          borderRadius: "50%",
          border: `2px solid ${ringColor || moodColor}66`,
          boxShadow: ringColor
            ? `0 0 8px ${ringColor}66`
            : `0 0 6px ${moodColor}44`,
          background: `hsl(${person.hue}, 25%, 12%)`,
        }}
      >
        <rect
          width="32"
          height="32"
          fill={`hsl(${person.hue}, 22%, 13%)`}
          rx="16"
        />

        {/* Neck */}
        <rect x="13" y="26" width="6" height="5" fill={traits.skin} />
        {/* Shoulders / shirt */}
        <rect
          x="5"
          y="29"
          width="22"
          height="4"
          fill={`hsl(${person.hue}, 55%, 28%)`}
          rx="2"
        />

        {/* Face */}
        <ellipse
          cx="16"
          cy="19"
          rx={traits.faceShape === 2 ? 8 : 7}
          ry={traits.faceShape === 1 ? 9 : 8}
          fill={traits.skin}
        />

        {/* Hair (behind face for long style) */}
        {traits.hairStyle === 2 && <path d={hairPaths[2]} fill={traits.hair} />}

        {/* Ears */}
        <ellipse cx="8" cy="19" rx="2" ry="2.5" fill={traits.skin} />
        <ellipse cx="24" cy="19" rx="2" ry="2.5" fill={traits.skin} />

        {/* Hair (on top) */}
        {traits.hairStyle !== 2 && (
          <path d={hairPaths[traits.hairStyle]} fill={traits.hair} />
        )}

        {/* Eyebrows */}
        {showAnger ? (
          <>
            <line
              x1="11"
              y1={eyeY - 2}
              x2="14.5"
              y2={eyeY - 3.5}
              stroke={traits.hair}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="17.5"
              y1={eyeY - 3.5}
              x2="21"
              y2={eyeY - 2}
              stroke={traits.hair}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        ) : hoursWaiting >= 48 ? (
          <>
            <line
              x1="11"
              y1={eyeY - 2.5}
              x2="14.5"
              y2={eyeY - 3}
              stroke={traits.hair}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="17.5"
              y1={eyeY - 3}
              x2="21"
              y2={eyeY - 2.5}
              stroke={traits.hair}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <line
              x1="11"
              y1={eyeY - 3}
              x2="14.5"
              y2={eyeY - 3}
              stroke={traits.hair}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="17.5"
              y1={eyeY - 3}
              x2="21"
              y2={eyeY - 3}
              stroke={traits.hair}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Eyes */}
        {isBlink ? (
          <>
            <line
              x1="11"
              y1={eyeY}
              x2="14.5"
              y2={eyeY}
              stroke={traits.eyeColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="17.5"
              y1={eyeY}
              x2="21"
              y2={eyeY}
              stroke={traits.eyeColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        ) : showAnger ? (
          <>
            <line
              x1="11"
              y1={eyeY - eyeSize}
              x2={11 + eyeSize * 2}
              y2={eyeY + eyeSize}
              stroke="#f87171"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1={11 + eyeSize * 2}
              y1={eyeY - eyeSize}
              x2="11"
              y2={eyeY + eyeSize}
              stroke="#f87171"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="17.5"
              y1={eyeY - eyeSize}
              x2={17.5 + eyeSize * 2}
              y2={eyeY + eyeSize}
              stroke="#f87171"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1={17.5 + eyeSize * 2}
              y1={eyeY - eyeSize}
              x2="17.5"
              y2={eyeY + eyeSize}
              stroke="#f87171"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle cx="12.5" cy={eyeY} r={eyeSize} fill={traits.eyeColor} />
            <circle cx="19.5" cy={eyeY} r={eyeSize} fill={traits.eyeColor} />
            <circle
              cx="13.2"
              cy={eyeY - 0.6}
              r="0.65"
              fill="white"
              opacity="0.85"
            />
            <circle
              cx="20.2"
              cy={eyeY - 0.6}
              r="0.65"
              fill="white"
              opacity="0.85"
            />
          </>
        )}

        {/* Mouth */}
        <path
          d={getMouthPath()}
          stroke="#7a4040"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
        {hoursWaiting < 8 && (
          <path d="M 13.5 24.5 Q 16 27 18.5 24.5" fill="white" opacity="0.6" />
        )}

        {/* Beard */}
        {traits.hasBeard && (
          <path
            d="M 10 23 Q 16 27 22 23 Q 22 25 16 26 Q 10 25 10 23 Z"
            fill={traits.hair}
            opacity="0.55"
          />
        )}

        {/* Accessories */}
        {traits.accessory === "glasses" && (
          <g
            stroke={`hsl(${person.hue}, 65%, 62%)`}
            strokeWidth="1"
            fill="none"
          >
            <rect x="9.5" y={eyeY - 2.5} width="5" height="5" rx="2.5" />
            <rect x="17.5" y={eyeY - 2.5} width="5" height="5" rx="2.5" />
            <line x1="14.5" y1={eyeY} x2="17.5" y2={eyeY} />
            <line x1="9" y1={eyeY - 0.5} x2="7.5" y2={eyeY - 1.5} />
            <line x1="22.5" y1={eyeY - 0.5} x2="24" y2={eyeY - 1.5} />
          </g>
        )}
        {traits.accessory === "headband" && (
          <rect
            x="7"
            y="11"
            width="18"
            height="3"
            fill={`hsl(${person.hue}, 75%, 52%)`}
            rx="1.5"
            opacity="0.9"
          />
        )}
        {traits.accessory === "earring" && (
          <>
            <circle
              cx="24.5"
              cy="20"
              r="1.4"
              fill={`hsl(${person.hue}, 80%, 65%)`}
            />
            <line
              x1="24.5"
              y1="21.4"
              x2="24.5"
              y2="23"
              stroke={`hsl(${person.hue}, 70%, 55%)`}
              strokeWidth="0.8"
            />
          </>
        )}
        {traits.accessory === "cap" && (
          <>
            <path
              d="M 7 13 Q 16 6 25 13 L 25 15 Q 16 8 7 15 Z"
              fill={`hsl(${person.hue}, 55%, 32%)`}
            />
            <rect
              x="5"
              y="13"
              width="22"
              height="3"
              fill={`hsl(${person.hue}, 55%, 28%)`}
              rx="1"
            />
            <rect
              x="14"
              y="8"
              width="4"
              height="5"
              fill={`hsl(${person.hue}, 55%, 35%)`}
            />
          </>
        )}

        {/* Sweat drop */}
        {showSweat && (
          <g opacity="0.85">
            <ellipse cx="25.5" cy="13" rx="1.3" ry="1.8" fill="#93c5fd" />
            <polygon points="24.5,11.5 26.5,11.5 25.5,9.5" fill="#93c5fd" />
          </g>
        )}

        {/* Anger sparks */}
        {showAnger && (
          <>
            <path
              d="M 3 10 L 5.5 7.5 L 4.5 11 L 7 8.5"
              stroke="#fca5a5"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 25 10 L 27.5 7.5 L 26.5 11 L 29 8.5"
              stroke="#fca5a5"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>

      {/* Review status badge */}
      {ring === "approved" && (
        <div
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#4ade80",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 7,
            color: "#052e16",
            fontWeight: 900,
            border: "1.5px solid #020c14",
          }}
        >
          ✓
        </div>
      )}
      {ring === "changes_requested" && (
        <div
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#f87171",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 7,
            color: "#fff",
            fontWeight: 900,
            border: "1.5px solid #020c14",
          }}
        >
          ✗
        </div>
      )}
    </div>
  );
}

function formatWait(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24),
    h = hours % 24;
  return h ? `${d}d ${h}h` : `${d}d`;
}

function SizeChip({ size }) {
  const colors = { S: "#4ade80", M: "#facc15", L: "#fb923c", XL: "#f87171" };
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: colors[size] || "#94a3b8",
        border: `1px solid ${colors[size] || "#94a3b8"}55`,
        borderRadius: 3,
        padding: "1px 4px",
        fontFamily: "'DM Mono', monospace",
        flexShrink: 0,
      }}
    >
      {size}
    </span>
  );
}

function PRCard({ pr, index }) {
  const staleness = getStaleness(pr);
  const blockedBy = getBlockedBy(pr);
  const moodColor =
    staleness < 8
      ? "#4ade80"
      : staleness < 24
        ? "#a3e635"
        : staleness < 48
          ? "#facc15"
          : staleness < 72
            ? "#fb923c"
            : "#f87171";
  const cardBg =
    staleness < 8
      ? "#052e16"
      : staleness < 24
        ? "#1a2e05"
        : staleness < 48
          ? "#2d1f02"
          : staleness < 72
            ? "#2c0f02"
            : "#2c0202";
  const anim =
    staleness < 8
      ? "bounce-happy"
      : staleness < 24
        ? "wobble-mild"
        : staleness < 48
          ? "pulse-yellow"
          : staleness < 72
            ? "shake-anxious"
            : "rage-shake";

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setFrame((f) => (f + 1) % 4),
      650 + index * 110,
    );
    return () => clearInterval(t);
  }, []);

  const allApproved = pr.reviewers.every((r) => r.status === "approved");
  const hasChanges = pr.reviewers.some((r) => r.status === "changes_requested");

  // Unified status — same language as top filter chips
  const statusInfo = pr.reviewers.every((r) => r.status === "approved")
    ? {
        text: "✅ approved",
        color: "#4ade80",
        bg: "#4ade8014",
        border: "#4ade8033",
      }
    : pr.reviewers.some((r) => r.status === "changes_requested") &&
        pr.reviewers.every((r) => r.status !== "pending")
      ? {
          text: "🔁 changes needed",
          color: "#fb923c",
          bg: "#fb923c14",
          border: "#fb923c33",
        }
      : pr.reviewers.some((r) => r.status === "pending")
        ? {
            text: "👀 awaiting review",
            color: "#facc15",
            bg: "#facc1514",
            border: "#facc1533",
          }
        : {
            text: "⏳ pending",
            color: "#94a3b8",
            bg: "#94a3b814",
            border: "#94a3b833",
          };

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
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 30px ${moodColor}35, inset 0 1px 0 ${moodColor}22`)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 20px ${moodColor}15, inset 0 1px 0 ${moodColor}22`)
      }
    >
      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: 12,
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Top row: avatar + title + diff */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
          <PixelAvatar
            person={pr.author}
            size={50}
            hoursWaiting={staleness}
            frame={frame}
          />
          <span
            style={{
              fontSize: 7,
              color: `hsl(${pr.author.hue}, 70%, 60%)`,
              fontFamily: "'DM Mono', monospace",
              maxWidth: 50,
              textAlign: "center",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {pr.author.name.split(" ")[0]}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 0,
          }}
        >
          {/* Title + diff */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
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
              {pr.title}
            </div>
          </div>

          {/* Size + diff stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SizeChip size={pr.size} />
            <span
              style={{
                fontSize: 9,
                color: "#4ade80",
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
              }}
            >
              +{pr.additions}
            </span>
            <span
              style={{
                fontSize: 9,
                color: "#f87171",
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
              }}
            >
              −{pr.deletions}
            </span>
            <span style={{ flex: 1 }} />
            {/* Blocked-by pill */}
            <span
              style={{
                fontSize: 8,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.06em",
                borderRadius: 4,
                padding: "2px 6px",
                flexShrink: 0,
                color: statusInfo.color,
                background: statusInfo.bg,
                border: `1px solid ${statusInfo.border}`,
              }}
            >
              {statusInfo.text}
            </span>
          </div>

          {/* Time row: inactivity + opened */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: `${moodColor}14`,
                border: `1px solid ${moodColor}33`,
                borderRadius: 5,
                padding: "3px 7px",
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  color: moodColor,
                  opacity: 0.7,
                  letterSpacing: "0.05em",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                idle
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: moodColor,
                  fontFamily: "'DM Mono', monospace",
                  lineHeight: 1,
                }}
              >
                {formatWait(staleness)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 5,
                padding: "3px 7px",
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  color: "#475569",
                  letterSpacing: "0.05em",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                opened
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#64748b",
                  fontFamily: "'DM Mono', monospace",
                  lineHeight: 1,
                }}
              >
                {formatWait(pr.openedHours)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Branch row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 9,
            color: "#475569",
            fontFamily: "'DM Mono', monospace",
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 4,
            padding: "2px 6px",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          ⎇ {pr.branch}
        </span>
        {pr.comments > 0 && (
          <span
            style={{
              fontSize: 9,
              color: "#94a3b8",
              fontFamily: "'DM Mono', monospace",
              flexShrink: 0,
            }}
          >
            💬 {pr.comments}
          </span>
        )}
      </div>

      {/* Reviewers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 8,
            color: "#334155",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.1em",
          }}
        >
          REVIEWERS
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {pr.reviewers.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <PixelAvatar person={r} size={32} ring={r.status} />
              <span
                style={{
                  fontSize: 6,
                  color: "#475569",
                  fontFamily: "'DM Mono', monospace",
                  maxWidth: 32,
                  textAlign: "center",
                  lineHeight: 1.1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        {allApproved && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              color: "#4ade80",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              border: "1px solid #4ade8044",
              borderRadius: 4,
              padding: "1px 5px",
              animation: "glowGreen 2s ease-in-out infinite",
            }}
          >
            ✓ READY
          </span>
        )}
        {hasChanges && !allApproved && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              color: "#f87171",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              border: "1px solid #f8717144",
              borderRadius: 4,
              padding: "1px 5px",
            }}
          >
            ✗ CHANGES
          </span>
        )}
      </div>
    </div>
  );
}

// ── KARMA CALCULATION ────────────────────────────────────────────────
// blocking: sum of staleness of PRs where this person is a *pending* reviewer
// blocked:  sum of staleness of PRs this person authored where reviewers are pending
// net = blocked - blocking  (positive = you're being held up more than you hold up)
function computeKarma(allPeople) {
  const stats = {};
  allPeople.forEach((p) => {
    stats[p.name] = {
      person: p,
      blocking: 0,
      blocked: 0,
      blockingPRs: 0,
      blockedPRs: 0,
    };
  });

  MOCK_PRS.forEach((pr) => {
    const staleness = getStaleness(pr);
    const pendingReviewers = pr.reviewers.filter((r) => r.status === "pending");
    const authorName = pr.author.name;

    // Each pending reviewer is blocking this PR's author
    pendingReviewers.forEach((r) => {
      if (stats[r.name]) {
        stats[r.name].blocking += staleness;
        stats[r.name].blockingPRs += 1;
      }
    });

    // If there are pending reviewers, the author is being blocked
    if (pendingReviewers.length > 0 && stats[authorName]) {
      stats[authorName].blocked += staleness;
      stats[authorName].blockedPRs += 1;
    }
  });

  return Object.values(stats);
}

function KarmaFilterPanel({
  allPeople,
  karma,
  authorFilters,
  reviewerFilters,
  onToggleAuthor,
  onToggleReviewer,
  onClear,
  hasFilters,
}) {
  // Count authored / reviewing PRs per person (from full dataset)
  const authoredCount = (name) =>
    MOCK_PRS.filter((pr) => pr.author.name === name).length;
  const reviewingCount = (name) =>
    MOCK_PRS.filter((pr) => pr.reviewers.some((r) => r.name === name)).length;

  return (
    <div
      style={{
        marginTop: 16,
        background: "#080f1a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 8,
            color: "#334155",
            letterSpacing: "0.18em",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ◆ TEAM KARMA
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            style={{
              fontSize: 7,
              color: "#1e293b",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            ✏️ authored · 👁 reviewing
          </span>
          {hasFilters && (
            <button
              onClick={onClear}
              style={{
                background: "none",
                border: "1px solid #334155",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 7,
                color: "#64748b",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
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
          const netColor =
            net < -20 ? "#f87171" : net > 20 ? "#facc15" : "#94a3b8";
          const isDevil = blocking > 0 && blocking >= blocked; // net blocker
          const isAngel = blocked > 0 && blocked > blocking; // net victim
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
                background: isActive
                  ? `hsl(${person.hue}, 30%, 10%)`
                  : "transparent",
                border: `1px solid ${isActive ? `hsl(${person.hue}, 60%, 30%)` : "#1e293b"}`,
                borderRadius: 10,
                padding: "10px 10px 8px",
                minWidth: 76,
                transition: "all 0.15s ease",
              }}
            >
              {/* Avatar with halo or horns rendered in SVG overlay */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Angel halo */}
                {isAngel && (
                  <svg
                    width="52"
                    height="14"
                    viewBox="0 0 52 14"
                    style={{
                      position: "absolute",
                      top: -11,
                      left: "50%",
                      transform: "translateX(-50%)",
                      overflow: "visible",
                      pointerEvents: "none",
                    }}
                  >
                    <ellipse
                      cx="26"
                      cy="7"
                      rx="16"
                      ry="5"
                      fill="none"
                      stroke="#fde68a"
                      strokeWidth="2.5"
                      opacity="0.9"
                      style={{ filter: "drop-shadow(0 0 4px #fde68a)" }}
                    />
                  </svg>
                )}
                {/* Devil horns */}
                {isDevil && (
                  <svg
                    width="52"
                    height="16"
                    viewBox="0 0 52 16"
                    style={{
                      position: "absolute",
                      top: -13,
                      left: "50%",
                      transform: "translateX(-50%)",
                      overflow: "visible",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      d="M 14 14 L 11 4 L 20 10 Z"
                      fill="#f87171"
                      opacity="0.92"
                      style={{ filter: "drop-shadow(0 0 3px #f87171)" }}
                    />
                    <path
                      d="M 38 14 L 41 4 L 32 10 Z"
                      fill="#f87171"
                      opacity="0.92"
                      style={{ filter: "drop-shadow(0 0 3px #f87171)" }}
                    />
                  </svg>
                )}
                <PixelAvatar
                  person={person}
                  size={44}
                  hoursWaiting={0}
                  frame={0}
                />
              </div>

              {/* Name */}
              <span
                style={{
                  fontSize: 7,
                  fontFamily: "'DM Mono', monospace",
                  color: `hsl(${person.hue}, 65%, 62%)`,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {person.name.split(" ")[0]}
              </span>

              {/* Net karma */}
              {(blocking > 0 || blocked > 0) && (
                <span
                  style={{
                    fontSize: 7,
                    color: netColor,
                    fontFamily: "'DM Mono', monospace",
                    border: `1px solid ${netColor}33`,
                    borderRadius: 3,
                    padding: "1px 4px",
                  }}
                >
                  {net > 0 ? `+${net}h` : `${net}h`}
                </span>
              )}

              {/* Count badges — these are the clickable filters */}
              <div style={{ display: "flex", gap: 4 }}>
                {/* Authored count */}
                <button
                  onClick={() => onToggleAuthor(person.name)}
                  title={`Show PRs authored by ${person.name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    background: isAuthorActive
                      ? `hsl(${person.hue}, 45%, 18%)`
                      : "#0f172a",
                    border: `1px solid ${isAuthorActive ? `hsl(${person.hue}, 60%, 40%)` : "#1e293b"}`,
                    borderRadius: 5,
                    padding: "3px 6px",
                    cursor: "pointer",
                    boxShadow: isAuthorActive
                      ? `0 0 8px hsl(${person.hue},60%,30%)55`
                      : "none",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: 9 }}>✏️</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: isAuthorActive
                        ? `hsl(${person.hue}, 80%, 65%)`
                        : "#475569",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {authored}
                  </span>
                </button>

                {/* Reviewing count */}
                <button
                  onClick={() => onToggleReviewer(person.name)}
                  title={`Show PRs where ${person.name} is a reviewer`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    background: isReviewerActive
                      ? `hsl(${person.hue}, 45%, 18%)`
                      : "#0f172a",
                    border: `1px solid ${isReviewerActive ? `hsl(${person.hue}, 60%, 40%)` : "#1e293b"}`,
                    borderRadius: 5,
                    padding: "3px 6px",
                    cursor: "pointer",
                    boxShadow: isReviewerActive
                      ? `0 0 8px hsl(${person.hue},60%,30%)55`
                      : "none",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: 9 }}>👁</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: isReviewerActive
                        ? `hsl(${person.hue}, 80%, 65%)`
                        : "#475569",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
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

// Collect unique people across all PRs
function getAllPeople() {
  const byName = {};
  MOCK_PRS.forEach((pr) => {
    byName[pr.author.name] = pr.author;
    pr.reviewers.forEach((r) => {
      byName[r.name] = {
        name: r.name,
        initials: r.initials,
        hue: r.hue,
        seed: r.seed,
      };
    });
  });
  return Object.values(byName).sort((a, b) => a.name.localeCompare(b.name));
}

export default function PRTamagotchi() {
  const [authorFilters, setAuthorFilters] = useState(new Set());
  const [reviewerFilters, setReviewerFilters] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(null); // 'pending'|'approved'|'changes'|'stale'

  const allPeople = getAllPeople();
  const karma = computeKarma(allPeople).sort((a, b) => b.blocking - a.blocking);

  const toggle = (set, setFn, name) => {
    setFn((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const filteredPRs = MOCK_PRS.filter((pr) => {
    const authorOk =
      authorFilters.size === 0 || authorFilters.has(pr.author.name);
    const reviewerOk =
      reviewerFilters.size === 0 ||
      pr.reviewers.some((r) => reviewerFilters.has(r.name));
    const statusOk =
      !statusFilter ||
      (statusFilter === "pending" &&
        pr.reviewers.some((r) => r.status === "pending")) ||
      (statusFilter === "approved" &&
        pr.reviewers.every((r) => r.status === "approved")) ||
      (statusFilter === "changes" &&
        pr.reviewers.some((r) => r.status === "changes_requested")) ||
      (statusFilter === "stale" && getStaleness(pr) >= 48);
    return authorOk && reviewerOk && statusOk;
  }).sort((a, b) => getStaleness(b) - getStaleness(a));

  const totalAnxious = filteredPRs.filter((p) => getStaleness(p) >= 48).length;
  const hasFilters =
    authorFilters.size > 0 || reviewerFilters.size > 0 || statusFilter !== null;

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Silkscreen:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .bounce-happy { animation: bounceHappy 1.6s ease-in-out infinite; }
        .wobble-mild  { animation: wobbleMild 2.2s ease-in-out infinite; }
        .pulse-yellow { animation: pulseYellow 1.8s ease-in-out infinite; }
        .shake-anxious{ animation: shakeAnxious 0.9s ease-in-out infinite; }
        .rage-shake   { animation: rageShake 0.4s ease-in-out infinite; }
        @keyframes bounceHappy { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes wobbleMild  { 0%,100%{transform:rotate(0)} 25%{transform:rotate(.5deg)} 75%{transform:rotate(-.5deg)} }
        @keyframes pulseYellow { 0%,100%{transform:scale(1)} 50%{transform:scale(1.01)} }
        @keyframes shakeAnxious{ 0%,100%{transform:translateX(0)} 25%{transform:translateX(-2px) rotate(-.5deg)} 75%{transform:translateX(2px) rotate(.5deg)} }
        @keyframes rageShake   { 0%,100%{transform:translateX(0) rotate(0)} 20%{transform:translateX(-3px) rotate(-1deg)} 40%{transform:translateX(3px) rotate(1deg)} 60%{transform:translateX(-2px) rotate(-.5deg)} 80%{transform:translateX(2px) rotate(.5deg)} }
        @keyframes glowGreen   { 0%,100%{box-shadow:0 0 4px #4ade8044} 50%{box-shadow:0 0 12px #4ade8088} }
        @keyframes scanTick    { from{opacity:.7} to{opacity:1} }
        @keyframes fadeIn      { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .pr-card { transition: all 0.2s ease; cursor: default; }
        .pr-card:hover { transform: translateY(-1px); }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 14px; max-width: 1100px; margin: 0 auto;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto 20px" }}>
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
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
          <span
            style={{ fontSize: 10, color: "#334155", letterSpacing: "0.2em" }}
          >
            ◆ PR QUEUE ◆
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: "#334155",
              letterSpacing: "0.1em",
              animation: "scanTick 1s step-start infinite",
            }}
          >
            ● LIVE {String(new Date().getHours()).padStart(2, "0")}:
            {String(new Date().getMinutes()).padStart(2, "0")}
          </span>
        </div>

        {/* Stats — clickable filters. Use ALL_PRS for counts so they don't collapse when filtered */}
        {(() => {
          const allPRs = MOCK_PRS;
          const chips = [
            { key: null, label: "ALL", val: allPRs.length, color: "#94a3b8" },
            {
              key: "pending",
              label: "AWAITING REVIEW",
              val: allPRs.filter((p) =>
                p.reviewers.some((r) => r.status === "pending"),
              ).length,
              color: "#facc15",
            },
            {
              key: "approved",
              label: "APPROVED",
              val: allPRs.filter((p) =>
                p.reviewers.every((r) => r.status === "approved"),
              ).length,
              color: "#4ade80",
            },
            {
              key: "changes",
              label: "NEEDS CHANGES",
              val: allPRs.filter((p) =>
                p.reviewers.some((r) => r.status === "changes_requested"),
              ).length,
              color: "#f87171",
            },
            {
              key: "stale",
              label: "STALE 48h+",
              val: allPRs.filter((p) => getStaleness(p) >= 48).length,
              color: "#fb923c",
            },
          ];
          return (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {chips.map((s) => {
                const active = statusFilter === s.key;
                return (
                  <button
                    key={s.label}
                    onClick={() => setStatusFilter(active ? null : s.key)}
                    style={{
                      background: active ? `${s.color}22` : `${s.color}0f`,
                      border: `1px solid ${active ? s.color : s.color + "33"}`,
                      borderRadius: 6,
                      padding: "5px 10px",
                      display: "flex",
                      gap: 6,
                      alignItems: "baseline",
                      cursor: "pointer",
                      boxShadow: active ? `0 0 10px ${s.color}33` : "none",
                      transition: "all 0.15s ease",
                      outline: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: s.color,
                        lineHeight: 1,
                      }}
                    >
                      {s.val}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        color: active ? s.color : "#475569",
                        letterSpacing: "0.15em",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* ── COMBINED KARMA + FILTER PANEL ── */}
        <KarmaFilterPanel
          allPeople={allPeople}
          karma={karma}
          authorFilters={authorFilters}
          reviewerFilters={reviewerFilters}
          onToggleAuthor={(name) =>
            toggle(authorFilters, setAuthorFilters, name)
          }
          onToggleReviewer={(name) =>
            toggle(reviewerFilters, setReviewerFilters, name)
          }
          onClear={() => {
            setAuthorFilters(new Set());
            setReviewerFilters(new Set());
            setStatusFilter(null);
          }}
          hasFilters={hasFilters}
        />
      </div>

      {/* Cards */}
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
            <div style={{ fontSize: 9, marginTop: 6, color: "#1e293b" }}>
              adjust filters above
            </div>
          </div>
        )}
      </div>

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
          AVATAR CLICK = filter by author · 👁 badge = filter by reviewer
        </span>
      </div>
    </div>
  );
}
