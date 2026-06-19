export function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;

  const n = typeof value === "number" ? value : Number(value);

  return isNaN(n) ? fallback : n;
}
