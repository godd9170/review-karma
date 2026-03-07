const colors = { S: "#4ade80", M: "#facc15", L: "#fb923c", XL: "#f87171" };

export default function SizeChip({ size }) {
  const color = colors[size] || "#94a3b8";
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color,
        border: `1px solid ${color}55`,
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
