"use client";

export default function LoadingScreen({ error, onRetry }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020c14",
        backgroundImage: `
          radial-gradient(ellipse at 20% 0%, #0c2a1a 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, #1a0a2e 0%, transparent 50%)
        `,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <style>{`
        @keyframes showHalo  { 0%,42%{opacity:1} 50%,100%{opacity:0} }
        @keyframes showHorns { 0%,42%{opacity:0} 50%,100%{opacity:1} }
        @keyframes haloFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes hornPulse { 0%,100%{filter:drop-shadow(0 0 3px #f87171)} 50%{filter:drop-shadow(0 0 8px #f87171)} }
        @keyframes eyeBlink  { 0%,90%,100%{scaleY:1} 95%{transform:scaleY(0.1)} }
        @keyframes loadDots  { 0%{content:"."} 33%{content:".."} 66%{content:"..."} 100%{content:"."} }
        .load-dots::after { content: "."; animation: loadDots 1.4s step-start infinite; }
      `}</style>

      {/* Main graphic */}
      <svg width="140" height="180" viewBox="0 0 140 180">
        {/* Halo — visible first half of cycle */}
        <g style={{ animation: "showHalo 3.2s ease-in-out infinite" }}>
          <g style={{ animation: "haloFloat 3.2s ease-in-out infinite" }}>
            <ellipse
              cx="70" cy="34" rx="34" ry="10"
              fill="none" stroke="#fde68a" strokeWidth="4"
              style={{ filter: "drop-shadow(0 0 8px #fde68a)" }}
            />
            {/* Halo shine */}
            <ellipse cx="58" cy="31" rx="7" ry="2.5" fill="#fde68a" opacity="0.35" />
          </g>
        </g>

        {/* Devil horns — visible second half of cycle */}
        <g style={{ animation: "showHorns 3.2s ease-in-out infinite", animationDelay: "0s" }}>
          <g style={{ animation: "hornPulse 1s ease-in-out infinite" }}>
            <path d="M 40 54 L 33 24 L 56 46 Z" fill="#f87171" opacity="0.95" />
            <path d="M 100 54 L 107 24 L 84 46 Z" fill="#f87171" opacity="0.95" />
            {/* Horn highlights */}
            <path d="M 40 54 L 35 30 L 44 44 Z" fill="#fca5a5" opacity="0.4" />
            <path d="M 100 54 L 105 30 L 96 44 Z" fill="#fca5a5" opacity="0.4" />
          </g>
        </g>

        {/* Face */}
        <circle cx="70" cy="108" r="44" fill="#080f1a" />
        <circle cx="70" cy="108" r="43" fill="none" stroke="#1e293b" strokeWidth="1.5" />

        {/* Subtle hue tint on face */}
        <circle cx="70" cy="108" r="43" fill="#4ade80" opacity="0.03" />

        {/* Ears */}
        <ellipse cx="27" cy="108" rx="5" ry="7" fill="#1e293b" />
        <ellipse cx="113" cy="108" rx="5" ry="7" fill="#1e293b" />

        {/* Eyes */}
        <circle cx="55" cy="102" r="5.5" fill="#4ade80" opacity="0.85" />
        <circle cx="85" cy="102" r="5.5" fill="#4ade80" opacity="0.85" />
        {/* Pupils */}
        <circle cx="56" cy="101" r="2.5" fill="#052e16" />
        <circle cx="86" cy="101" r="2.5" fill="#052e16" />
        {/* Eye shine */}
        <circle cx="57.5" cy="99.5" r="1.2" fill="white" opacity="0.8" />
        <circle cx="87.5" cy="99.5" r="1.2" fill="white" opacity="0.8" />

        {/* Eyebrows — neutral curious */}
        <line x1="48" y1="93" x2="63" y2="93" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="77" y1="93" x2="92" y2="93" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

        {/* Mouth — slight smile */}
        <path d="M 57 120 Q 70 128 83 120" stroke="#7a4040" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* Neck + shirt */}
        <rect x="62" y="148" width="16" height="10" fill="#1e293b" />
        <rect x="30" y="156" width="80" height="24" fill="#0f2a1a" rx="6" />
        <line x1="70" y1="158" x2="70" y2="178" stroke="#4ade8022" strokeWidth="1" />
      </svg>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'Silkscreen', monospace",
          fontSize: 26,
          color: "#e2e8f0",
          letterSpacing: "0.06em",
          lineHeight: 1,
          margin: 0,
        }}
      >
        REVIEW KARMA
      </h1>

      {/* Status */}
      {error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: "#f87171",
              background: "#f8717114",
              border: "1px solid #f8717133",
              borderRadius: 6,
              padding: "8px 14px",
              maxWidth: 320,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
          <button
            onClick={onRetry}
            style={{
              background: "#4ade8022",
              border: "1px solid #4ade8044",
              borderRadius: 6,
              padding: "6px 16px",
              color: "#4ade80",
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              cursor: "pointer",
            }}
          >
            ↺ RETRY
          </button>
        </div>
      ) : (
        <span
          className="load-dots"
          style={{
            fontSize: 9,
            color: "#334155",
            letterSpacing: "0.2em",
          }}
        >
          SYNCING WITH GITHUB
        </span>
      )}
    </div>
  );
}
