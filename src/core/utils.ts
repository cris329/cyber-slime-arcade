export function formatScore(value: number): string {
  return Math.max(0, Math.floor(value)).toString().padStart(6, "0");
}

export function padTwo(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}
