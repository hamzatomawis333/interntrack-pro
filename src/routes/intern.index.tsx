import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, PageHeader, StatCard } from "@/components/ui-kit";
import { fmtDateLong, fmtTime, isWeekend } from "@/lib/date-utils";
import { toast } from "sonner";
import { LogIn, LogOut, Clock, CalendarDays, Timer, Target } from "lucide-react";

export const Route = createFileRoute("/intern/")({
  component: InternDashboard,
});

interface AttendanceRow {
  id: number;
  attendance_date: string;
  day_name: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  status: string;
}

interface Summary {
  today_hours: number;
  weekly_hours: number;
  rendered_hours: number;
  required_hours: number;
  today: AttendanceRow | null;
  recent: AttendanceRow[];
}

function InternDashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadSummary = async () => {
    try {
      const data = await api<Summary>("/attendance/summary");
      setSummary(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const weekend = isWeekend(now);
  const today = summary?.today ?? null;
  const canTimeIn = !weekend && !today?.time_in;
  const canTimeOut = !weekend && !!today?.time_in && !today?.time_out;

  const remaining = useMemo(() => {
    if (!summary) return 0;
    return Math.max(0, summary.required_hours - summary.rendered_hours);
  }, [summary]);

  const progress = useMemo(() => {
    if (!summary) return 0;
    return Math.min(100, (summary.rendered_hours / summary.required_hours) * 100);
  }, [summary]);

  const handleTimeIn = async () => {
    setActing(true);
    try {
      await api("/attendance/time-in", { method: "POST" });
      toast.success("Time in recorded");
      await loadSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Time in failed");
    } finally {
      setActing(false);
    }
  };

  const handleTimeOut = async () => {
    setActing(true);
    try {
      await api("/attendance/time-out", { method: "POST" });
      toast.success("Time out recorded");
      await loadSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Time out failed");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.fullname.split(" ")[0]} 👋`}
        description={fmtDateLong(now)}
      />

      {/* Clock + actions */}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
          <div className="bg-linear-to-br from-primary to-[oklch(0.5_0.14_175)] p-8 text-primary-foreground">
            <div className="text-xs uppercase tracking-wider text-white/70">Current time</div>
            <div className="mt-2 font-mono text-5xl font-semibold tracking-tight md:text-6xl">
              {now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <div className="mt-2 text-sm text-white/80">
              {now.toLocaleDateString(undefined, { weekday: "long" })} · {now.toLocaleDateString()}
            </div>

            {weekend && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                Weekend — attendance disabled
              </div>
            )}

            {!weekend && today?.time_in && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <Clock className="h-3.5 w-3.5" />
                Timed in at {fmtTime(today.time_in)}
              </div>
            )}
          </div>

          <div className="grid gap-3 p-6 md:p-8">
            <button
              onClick={handleTimeIn}
              disabled={!canTimeIn || acting}
              className="group flex h-24 items-center justify-center gap-3 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-(--shadow-elevated) disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              <LogIn className="h-6 w-6" />
              TIME IN
            </button>

            <button
              onClick={handleTimeOut}
              disabled={!canTimeOut || acting}
              className="group flex h-24 items-center justify-center gap-3 rounded-2xl border-2 border-primary bg-card text-lg font-semibold text-primary transition-all hover:bg-primary-soft disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
            >
              TIME OUT
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's hours"
          value={fmt(summary?.today_hours ?? 0)}
          icon={<Timer className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="This week"
          value={fmt(summary?.weekly_hours ?? 0)}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="Rendered"
          value={fmt(summary?.rendered_hours ?? 0)}
          icon={<Clock className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Remaining"
          value={fmt(remaining)}
          icon={<Target className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      {/* Progress */}
      <Card>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </Card>
    </div>
  );
}

function fmt(n: number | string) {
  return Number(n || 0).toFixed(2) + " h";
}
