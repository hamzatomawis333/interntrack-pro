import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Card, PageHeader, StatCard } from "@/components/ui-kit";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div className="bg-gradient-to-br from-primary to-[oklch(0.5_0.14_175)] p-8 text-primary-foreground">
            <div className="text-xs uppercase tracking-wider text-white/70">Current time</div>
            <div className="mt-2 font-mono text-5xl font-semibold tracking-tight md:text-6xl">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
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
              className="group flex h-24 items-center justify-center gap-3 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-elevated)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              <LogIn className="h-6 w-6 transition-transform group-enabled:group-hover:-translate-x-1" />
              TIME IN
            </button>
            <button
              onClick={handleTimeOut}
              disabled={!canTimeOut || acting}
              className="group flex h-24 items-center justify-center gap-3 rounded-2xl border-2 border-primary bg-card text-lg font-semibold text-primary transition-all hover:bg-primary-soft disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
            >
              TIME OUT
              <LogOut className="h-6 w-6 transition-transform group-enabled:group-hover:translate-x-1" />
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
          hint={`of ${summary?.required_hours ?? user?.required_hours ?? 486} h required`}
          icon={<Clock className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Remaining"
          value={fmt(remaining)}
          hint={`${progress.toFixed(1)}% complete`}
          icon={<Target className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      {/* Progress */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Progress to required hours</div>
            <div className="text-xs text-muted-foreground">
              {fmt(summary?.rendered_hours ?? 0)} of {summary?.required_hours ?? 486} hours
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-primary">
            {progress.toFixed(1)}%
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.7_0.16_155)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Recent attendance */}
      <Card className="p-0">
        <div className="border-b border-border px-5 py-4">
          <div className="text-sm font-semibold">Recent attendance</div>
          <div className="text-xs text-muted-foreground">Your last 10 working days</div>
        </div>
        <AttendanceTable rows={summary?.recent ?? []} loading={loading} />
      </Card>
    </div>
  );
}

function fmt(n: number) {
  return n.toFixed(2).replace(/\.00$/, "") + " h";
}

export function AttendanceTable({
  rows,
  loading,
}: {
  rows: AttendanceRow[];
  loading?: boolean;
}) {
  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        No attendance recorded yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Day</th>
            <th className="px-5 py-3 font-medium">Time In</th>
            <th className="px-5 py-3 font-medium">Time Out</th>
            <th className="px-5 py-3 text-right font-medium">Hours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="px-5 py-3 font-medium">{r.attendance_date}</td>
              <td className="px-5 py-3 text-muted-foreground">{r.day_name}</td>
              <td className="px-5 py-3 font-mono">{fmtTime(r.time_in)}</td>
              <td className="px-5 py-3 font-mono">{fmtTime(r.time_out)}</td>
              <td className="px-5 py-3 text-right font-semibold tabular-nums">
                {r.total_hours ? r.total_hours.toFixed(2) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

