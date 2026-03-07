const COLORS = [
  "#E63946", "#2A9D8F", "#E9C46A", "#F4A261",
  "#457B9D", "#8338EC", "#FB5607", "#3A86FF",
];

export function getUserColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}