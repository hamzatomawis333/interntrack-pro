import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/intern/calendar")({
  component: CalendarPage,
});

interface DayRecord {
  date: string;
  total_hours: number;
}

function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [selected, setSelected] = useState<DayRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<DayRecord[]>(`/attendance/calendar?year=${year}&month=${month + 1}`);
        const map: Record<string, DayRecord> = {};
        data.forEach((d) => (map[d.date] = d));
        setRecords(map);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load calendar");
      }
    };
    load();
  }, [year, month]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: { day: number | null; date?: string; weekend?: boolean }[] = [];
    for (let i = 0; i < startDay; i++) out.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      out.push({ day: d, date, weekend: dt.getDay() === 0 || dt.getDay() === 6 });
    }
    return out;
  }, [year, month]);

  const prev = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  };

  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(null);
  };

  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      <PageHeader title="Attendance calendar" description="Monthly view of your attendance." />

      <Card className="overflow-hidden shadow-sm border">
        {/* HEADER NAV */}
        <div className="flex items-center justify-between border-b bg-card px-4 py-4">
          <button
            onClick={prev}
            className="rounded-lg p-2 hover:bg-muted transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-base font-semibold tracking-wide">{monthName}</div>
            <button
              onClick={goToToday}
              className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Today
            </button>
          </div>

          <button
            onClick={next}
            className="rounded-lg p-2 hover:bg-muted transition"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* DAYS HEADER */}
        <div className="grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 bg-muted/30">
              {d}
            </div>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {cells.map((c, i) => {
            if (c.day === null) {
              return <div key={i} className="aspect-square bg-card" />;
            }

            const rec = c.date ? records[c.date] : undefined;

            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            const isToday = c.date === todayStr;

            const isPast = c.date && new Date(c.date) < new Date(todayStr);

            const isAbsent = !rec && !c.weekend && isPast;

            return (
              <button
                key={i}
                disabled={c.weekend}
                onClick={() => rec && setSelected(rec)}
                className={`
                relative aspect-square bg-card p-2 text-left
                transition hover:bg-muted/40
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
              >
                {/* DAY NUMBER */}
                <div
                  className={`
                  flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                  ${isToday ? "bg-primary text-white" : "text-foreground"}
                `}
                >
                  {c.day}
                </div>

                {/* HOURS */}
                {rec && (
                  <div className="absolute bottom-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {rec.total_hours.toFixed(1)}h
                  </div>
                )}

                {/* EMPTY DOT */}
                {isAbsent && (
                  <div
                    className="
    absolute
    bottom-2
    right-2
    rounded-full
    bg-red-500
    px-2
    py-1
    text-[10px]
    font-semibold
    text-white
    shadow-sm
    "
                  >
                    Absent
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap gap-4 border-t px-4 py-3 text-xs text-muted-foreground">
          <Legend color="bg-primary" label="Present" />
          <Legend color="bg-red-500" label="Absent" />
          <Legend color="bg-muted" label="Weekend" />
        </div>
      </Card>

      {/* SELECTED DAY CARD */}
      {selected && (
        <Card className="p-4">
          <div className="text-sm font-semibold">{selected.date}</div>
          <div className="text-2xl font-bold text-primary mt-1">
            {selected.total_hours.toFixed(2)} hours
          </div>
        </Card>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}
