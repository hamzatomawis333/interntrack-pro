import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader, StatCard } from "@/components/ui-kit";
import { Users, CheckCircle2, XCircle, Clock, ArrowRight, ClipboardList, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface Stats {
  total_interns: number;
  present_today: number;
  absent_today: number;
  total_rendered_hours: number;
  recent: {
    id: number;
    fullname: string;
    attendance_date: string;
    time_in: string | null;
    time_out: string | null;
    total_hours: number | null;
  }[];
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Stats>("/admin/stats");
        setStats(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin overview"
        description="Monitor interns and attendance at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total interns"
          value={stats?.total_interns ?? "—"}
          icon={<Users className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Present today"
          value={stats?.present_today ?? "—"}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Absent today"
          value={stats?.absent_today ?? "—"}
          icon={<XCircle className="h-5 w-5" />}
          tone="danger"
        />
        <StatCard
          label="Total rendered"
          value={`${(stats?.total_rendered_hours ?? 0).toFixed(0)} h`}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <QuickAction
          to="/admin/attendance"
          icon={<ClipboardList className="h-5 w-5" />}
          title="Attendance monitoring"
          desc="Filter by name, date, or month to review intern logs."
        />
        <QuickAction
          to="/admin/reports"
          icon={<BarChart3 className="h-5 w-5" />}
          title="Reports"
          desc="See rendered, remaining, and progress per intern."
        />
        <QuickAction
          to="/admin/users"
          icon={<Users className="h-5 w-5" />}
          title="Manage intern accounts"
          desc="View, edit required hours, or remove interns."
        />
      </div>

      <Card className="p-0">
        <div className="border-b border-border px-5 py-4 text-sm font-semibold">
          Recent activity
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (stats?.recent ?? []).length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No recent activity.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Intern</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Time In</th>
                  <th className="px-5 py-3 font-medium">Time Out</th>
                  <th className="px-5 py-3 text-right font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {stats!.recent.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{r.fullname}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.attendance_date}</td>
                    <td className="px-5 py-3 font-mono">{r.time_in ?? "—"}</td>
                    <td className="px-5 py-3 font-mono">{r.time_out ?? "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {r.total_hours ? r.total_hours.toFixed(2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to as never}
      className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <div className="mt-4 text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </Link>
  );
}
