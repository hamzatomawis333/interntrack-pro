import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, StatCard } from "@/components/ui-kit";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ClipboardList,
  BarChart3,
  FileText,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface RecentActivity {
  id: number;
  fullname: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
}

interface ReportRow {
  id: number;
  fullname: string;
  rendered_hours: number;
}

interface Stats {
  total_interns: number;
  present_today: number;
  absent_today: number;
  total_rendered_hours: number;
  recent: RecentActivity[];
}

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);

  const formatTime = (time: string | null) => {
    if (!time) return "\u2014";
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, reportsData] = await Promise.all([
          api<Stats>("/admin/stats"),
          api<ReportRow[]>("/admin/reports"),
        ]);
        setStats(statsData);
        setReportRows(reportsData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const dailyTrendData = (() => {
    if (!stats?.recent?.length) return [];
    const dayMap = new Map<string, { date: string; hours: number; count: number }>();
    stats.recent.forEach((r) => {
      const d = r.attendance_date;
      const existing = dayMap.get(d) || { date: d, hours: 0, count: 0 };
      existing.hours += Number(r.total_hours ?? 0);
      existing.count += 1;
      dayMap.set(d, existing);
    });
    return Array.from(dayMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        hours: Number(d.hours.toFixed(1)),
      }));
  })();

  const presentAbsentData = [
    { name: "Present", value: stats?.present_today ?? 0 },
    { name: "Absent", value: stats?.absent_today ?? 0 },
  ];
  const PIE_COLORS = ["#22c55e", "#ef4444"];

  const hoursPerInternData = reportRows.map((r) => ({
    name: r.fullname.length > 12 ? r.fullname.slice(0, 12) + "\u2026" : r.fullname,
    rendered: Number(r.rendered_hours ?? 0),
  }));

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-50 via-background to-cyan-50/40 p-8">
        <div className="absolute right-0 top-0 h-72 w-72 bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:justify-between lg:items-center">
          <div>
            <div className="text-sm font-semibold text-cyan-700">Welcome Back</div>
            <h1 className="mt-3 text-4xl font-bold">{user?.fullname || "Admin"}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Monitor attendance, reports, rendered hours, and intern activity.
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Interns"
              value={<AnimatedNumber value={stats?.total_interns ?? 0} />}
              icon={<Users className="h-5 w-5" />}
              tone="primary"
            />
            <StatCard
              label="Present Today"
              value={<AnimatedNumber value={stats?.present_today ?? 0} />}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="success"
            />
            <StatCard
              label="Absent Today"
              value={<AnimatedNumber value={stats?.absent_today ?? 0} />}
              icon={<XCircle className="h-5 w-5" />}
              tone="danger"
            />
            <StatCard
              label="Rendered Hours"
              value={
                <AnimatedNumber
                  value={Number(stats?.total_rendered_hours ?? 0)}
                  decimals={0}
                  suffix=" h"
                />
              }
              icon={<Clock className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* CHARTS */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Daily Attendance Trend */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold">Daily Attendance Trend</h3>
          <p className="mb-4 text-xs text-muted-foreground">Hours logged per day</p>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : dailyTrendData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
              No attendance data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  dot={{ fill: "#0891b2", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Present vs Absent */}
        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold">Present vs Absent</h3>
          <p className="mb-4 text-xs text-muted-foreground">Today&apos;s attendance</p>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (stats?.present_today ?? 0) + (stats?.absent_today ?? 0) === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
              No data for today
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={presentAbsentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {presentAbsentData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Rendered Hours per Intern */}
      <Card className="p-5">
        <h3 className="mb-1 text-sm font-semibold">Rendered Hours per Intern</h3>
        <p className="mb-4 text-xs text-muted-foreground">Current rendered hours</p>
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : hoursPerInternData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            No intern data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hoursPerInternData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Bar dataKey="rendered" name="Rendered Hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* QUICK */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold">Quick Access</h2>
          <p className="text-sm text-muted-foreground">Frequently used tools</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <QuickAction
            to="/admin/attendance"
            title="Attendance"
            desc="Review logs"
            icon={<ClipboardList />}
          />
          <QuickAction
            to="/admin/reports"
            title="Reports"
            desc="Progress data"
            icon={<BarChart3 />}
          />
          <QuickAction
            to="/admin/daily-reports"
            title="Daily Reports"
            desc="Review submissions"
            icon={<FileText />}
          />
          <QuickAction
            to="/admin/users"
            title="Manage Users"
            desc="Account controls"
            icon={<Users />}
          />
        </div>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden p-0">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : !stats?.recent?.length ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <div className="text-sm">No recent activity</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 text-left">Intern</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">In</th>
                  <th className="px-6 py-4 text-left">Out</th>
                  <th className="px-6 py-4 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted transition">
                    <td className="px-6 py-4 font-medium">{row.fullname}</td>
                    <td className="px-6 py-4">{row.attendance_date}</td>
                    <td className="px-6 py-4">{formatTime(row.time_in)}</td>
                    <td className="px-6 py-4">{formatTime(row.time_out)}</td>
                    <td className="px-6 py-4 text-right">
                      {Number(row.total_hours ?? 0).toFixed(2)}
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

interface QuickActionProps {
  to: string;
  icon: ReactNode;
  title: string;
  desc: string;
}

function QuickAction({ to, icon, title, desc }: QuickActionProps) {
  return (
    <Link
      to={to as never}
      className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-indigo-200 hover:shadow-[0_10px_35px_rgba(0,0,0,.06)] hover:-translate-y-0.5"
    >
      <div className="flex justify-between">
        <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 transition group-hover:bg-indigo-500/15">
          {icon}
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
      </div>
      <h3 className="mt-6 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
