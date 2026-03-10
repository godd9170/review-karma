export function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function getTraits(seed) {
  const r = seededRand(seed * 999 + 7);
  const skinTones = ["#FDDBB4", "#F5C28A", "#E8A96A", "#C68642", "#8D5524", "#FFDFC4"];
  const hairColors = ["#1a0a00", "#3b1f0a", "#6b3a2a", "#c49a3c", "#e8c97e", "#a0522d", "#4a4a4a", "#111827"];
  // Cap is weighted lower (1 in 10) because it hides hair, making avatars look the same
  const accessories = [null, null, null, "glasses", "glasses", "headband", "headband", "earring", "earring", "cap"];
  return {
    skin: skinTones[Math.floor(r() * skinTones.length)],
    hair: hairColors[Math.floor(r() * hairColors.length)],
    hairStyle: Math.floor(r() * 7),
    accessory: accessories[Math.floor(r() * accessories.length)],
    eyeColor: ["#2c4a7c", "#3a7c2c", "#7c3a2c", "#222", "#5a3a7c"][Math.floor(r() * 5)],
    hasBeard: r() > 0.72,
    faceShape: Math.floor(r() * 3),
  };
}
