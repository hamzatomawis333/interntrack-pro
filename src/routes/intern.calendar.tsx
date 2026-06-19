import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      if (year > 2026) {
        setYear(year - 1);
        setMonth(11);
      }
    } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) {
      if (year < 2027) {
        setYear(year + 1);
        setMonth(0);
      }
    } else setMonth(month + 1);
  };

  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance calendar"
        description="Monthly view of your attendance from 2026 to 2027."
      />

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button
            onClick={prev}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-base font-semibold">{monthName}</div>
          <button
            onClick={next}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px border-b border-border bg-border text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-muted/40 py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border">
          {cells.map((c, i) => {
            if (c.day === null) return <div key={i} className="aspect-square bg-card" />;
            const rec = c.date ? records[c.date] : undefined;
            const isToday =
              c.date ===
              `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            return (
              <button
                key={i}
                disabled={c.weekend}
                onClick={() => rec && setSelected(rec)}
                className={
                  "relative aspect-square bg-card p-2 text-left transition-colors disabled:opacity-50 " +
                  (rec ? "hover:bg-primary-soft" : "hover:bg-muted/40")
                }
              >
                <div
                  className={
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold " +
                    (isToday ? "bg-primary text-primary-foreground" : "text-foreground")
                  }
                >
                  {c.day}
                </div>
                {rec && (
                  <div className="absolute bottom-1.5 right-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {rec.total_hours.toFixed(1)}h
                  </div>
                )}
                {!rec && !c.weekend && (
                  <div className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <Legend color="bg-primary" label="Present" />
          <Legend color="bg-muted-foreground/30" label="Absent" />
          <Legend color="bg-muted" label="Weekend" />
        </div>
      </Card>

      {selected && (
        <Card>
          <div className="text-sm font-semibold">{selected.date}</div>
          <div className="mt-1 text-2xl font-semibold text-primary">
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
