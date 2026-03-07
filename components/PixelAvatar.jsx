"use client";

import { getTraits } from "@/lib/avatarTraits";

const hairPaths = [
  `M 8 11 Q 16 4 24 11 L 24 14 Q 16 7 8 14 Z`,
  `M 7 13 Q 10 4 16 5 Q 22 4 25 13 L 25 16 Q 22 8 16 9 Q 10 8 7 16 Z`,
  `M 7 13 Q 10 3 16 4 Q 22 3 25 13 L 26 27 Q 24 20 24 14 Q 16 8 8 14 L 6 27 Q 6 20 7 13 Z`,
  `M 9 14 Q 7 7 12 6 Q 14 3 16 4 Q 18 3 20 6 Q 25 7 23 14 Q 20 8 16 7 Q 12 8 9 14 Z`,
  `M 7 14 Q 9 4 18 5 Q 24 5 25 13 L 25 16 Q 20 7 14 8 Q 9 9 8 16 Z M 7 14 L 5 19 Q 6 15 8 16 Z`,
];

export default function PixelAvatar({ person, size = 40, hoursWaiting = 0, frame = 0, ring = null }) {
  const traits = getTraits(person.seed);

  const moodColor =
    hoursWaiting < 8 ? "#4ade80"
    : hoursWaiting < 24 ? "#a3e635"
    : hoursWaiting < 48 ? "#facc15"
    : hoursWaiting < 72 ? "#fb923c"
    : "#f87171";

  const ringColor =
    ring === "approved" ? "#4ade80"
    : ring === "changes_requested" ? "#f87171"
    : ring === "pending" ? "#64748b"
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

  return (
    <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        style={{
          display: "block",
          borderRadius: "50%",
          border: `2px solid ${ringColor || moodColor}66`,
          boxShadow: ringColor ? `0 0 8px ${ringColor}66` : `0 0 6px ${moodColor}44`,
          background: `hsl(${person.hue}, 25%, 12%)`,
        }}
      >
        <rect width="32" height="32" fill={`hsl(${person.hue}, 22%, 13%)`} rx="16" />

        {/* Neck */}
        <rect x="13" y="26" width="6" height="5" fill={traits.skin} />
        {/* Shoulders / shirt */}
        <rect x="5" y="29" width="22" height="4" fill={`hsl(${person.hue}, 55%, 28%)`} rx="2" />

        {/* Face */}
        <ellipse cx="16" cy="19" rx={traits.faceShape === 2 ? 8 : 7} ry={traits.faceShape === 1 ? 9 : 8} fill={traits.skin} />

        {/* Long hair (behind face) */}
        {traits.hairStyle === 2 && <path d={hairPaths[2]} fill={traits.hair} />}

        {/* Ears */}
        <ellipse cx="8" cy="19" rx="2" ry="2.5" fill={traits.skin} />
        <ellipse cx="24" cy="19" rx="2" ry="2.5" fill={traits.skin} />

        {/* Hair (on top) */}
        {traits.hairStyle !== 2 && <path d={hairPaths[traits.hairStyle]} fill={traits.hair} />}

        {/* Eyebrows */}
        {showAnger ? (
          <>
            <line x1="11" y1={eyeY - 2} x2="14.5" y2={eyeY - 3.5} stroke={traits.hair} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17.5" y1={eyeY - 3.5} x2="21" y2={eyeY - 2} stroke={traits.hair} strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : hoursWaiting >= 48 ? (
          <>
            <line x1="11" y1={eyeY - 2.5} x2="14.5" y2={eyeY - 3} stroke={traits.hair} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17.5" y1={eyeY - 3} x2="21" y2={eyeY - 2.5} stroke={traits.hair} strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <line x1="11" y1={eyeY - 3} x2="14.5" y2={eyeY - 3} stroke={traits.hair} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17.5" y1={eyeY - 3} x2="21" y2={eyeY - 3} stroke={traits.hair} strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {/* Eyes */}
        {isBlink ? (
          <>
            <line x1="11" y1={eyeY} x2="14.5" y2={eyeY} stroke={traits.eyeColor} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17.5" y1={eyeY} x2="21" y2={eyeY} stroke={traits.eyeColor} strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : showAnger ? (
          <>
            <line x1="11" y1={eyeY - eyeSize} x2={11 + eyeSize * 2} y2={eyeY + eyeSize} stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={11 + eyeSize * 2} y1={eyeY - eyeSize} x2="11" y2={eyeY + eyeSize} stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17.5" y1={eyeY - eyeSize} x2={17.5 + eyeSize * 2} y2={eyeY + eyeSize} stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={17.5 + eyeSize * 2} y1={eyeY - eyeSize} x2="17.5" y2={eyeY + eyeSize} stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="12.5" cy={eyeY} r={eyeSize} fill={traits.eyeColor} />
            <circle cx="19.5" cy={eyeY} r={eyeSize} fill={traits.eyeColor} />
            <circle cx="13.2" cy={eyeY - 0.6} r="0.65" fill="white" opacity="0.85" />
            <circle cx="20.2" cy={eyeY - 0.6} r="0.65" fill="white" opacity="0.85" />
          </>
        )}

        {/* Mouth */}
        <path d={getMouthPath()} stroke="#7a4040" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {hoursWaiting < 8 && (
          <path d="M 13.5 24.5 Q 16 27 18.5 24.5" fill="white" opacity="0.6" />
        )}

        {/* Beard */}
        {traits.hasBeard && (
          <path d="M 10 23 Q 16 27 22 23 Q 22 25 16 26 Q 10 25 10 23 Z" fill={traits.hair} opacity="0.55" />
        )}

        {/* Accessories */}
        {traits.accessory === "glasses" && (
          <g stroke={`hsl(${person.hue}, 65%, 62%)`} strokeWidth="1" fill="none">
            <rect x="9.5" y={eyeY - 2.5} width="5" height="5" rx="2.5" />
            <rect x="17.5" y={eyeY - 2.5} width="5" height="5" rx="2.5" />
            <line x1="14.5" y1={eyeY} x2="17.5" y2={eyeY} />
            <line x1="9" y1={eyeY - 0.5} x2="7.5" y2={eyeY - 1.5} />
            <line x1="22.5" y1={eyeY - 0.5} x2="24" y2={eyeY - 1.5} />
          </g>
        )}
        {traits.accessory === "headband" && (
          <rect x="7" y="11" width="18" height="3" fill={`hsl(${person.hue}, 75%, 52%)`} rx="1.5" opacity="0.9" />
        )}
        {traits.accessory === "earring" && (
          <>
            <circle cx="24.5" cy="20" r="1.4" fill={`hsl(${person.hue}, 80%, 65%)`} />
            <line x1="24.5" y1="21.4" x2="24.5" y2="23" stroke={`hsl(${person.hue}, 70%, 55%)`} strokeWidth="0.8" />
          </>
        )}
        {traits.accessory === "cap" && (
          <>
            <path d="M 7 13 Q 16 6 25 13 L 25 15 Q 16 8 7 15 Z" fill={`hsl(${person.hue}, 55%, 32%)`} />
            <rect x="5" y="13" width="22" height="3" fill={`hsl(${person.hue}, 55%, 28%)`} rx="1" />
            <rect x="14" y="8" width="4" height="5" fill={`hsl(${person.hue}, 55%, 35%)`} />
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
            <path d="M 3 10 L 5.5 7.5 L 4.5 11 L 7 8.5" stroke="#fca5a5" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 25 10 L 27.5 7.5 L 26.5 11 L 29 8.5" stroke="#fca5a5" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>

      {/* Review status badge */}
      {ring === "approved" && (
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 13, height: 13, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#052e16", fontWeight: 900, border: "1.5px solid #020c14" }}>
          ✓
        </div>
      )}
      {ring === "changes_requested" && (
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 13, height: 13, borderRadius: "50%", background: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", fontWeight: 900, border: "1.5px solid #020c14" }}>
          ✗
        </div>
      )}
    </div>
  );
}
