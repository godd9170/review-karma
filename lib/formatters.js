export function formatWait(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24), h = hours % 24;
  return h ? `${d}d ${h}h` : `${d}d`;
}

export function getMoodColor(hours) {
  if (hours < 8) return "#4ade80";
  if (hours < 24) return "#a3e635";
  if (hours < 48) return "#facc15";
  if (hours < 72) return "#fb923c";
  return "#f87171";
}

export function getCardBg(hours) {
  if (hours < 8) return "#052e16";
  if (hours < 24) return "#1a2e05";
  if (hours < 48) return "#2d1f02";
  if (hours < 72) return "#2c0f02";
  return "#2c0202";
}

export function getAnimClass(hours) {
  if (hours < 8) return "bounce-happy";
  if (hours < 24) return "wobble-mild";
  if (hours < 48) return "pulse-yellow";
  if (hours < 72) return "shake-anxious";
  return "rage-shake";
}
