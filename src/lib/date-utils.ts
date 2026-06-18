export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // assume "HH:MM:SS"
    const [h, m] = iso.split(":");
    if (h && m) {
      const hr = parseInt(h, 10);
      const ampm = hr >= 12 ? "PM" : "AM";
      const display = hr % 12 || 12;
      return `${display}:${m} ${ampm}`;
    }
    return iso;
  }
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtDateLong(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function hoursBetween(timeIn: string, timeOut: string): number {
  // "HH:MM:SS" same-day
  const toMin = (s: string) => {
    const [h, m, sec] = s.split(":").map(Number);
    return h * 60 + m + (sec || 0) / 60;
  };
  return Math.max(0, (toMin(timeOut) - toMin(timeIn)) / 60);
}
