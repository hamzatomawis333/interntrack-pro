import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
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
} from "lucide-react";
import { toast } from "sonner";

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

interface Stats {
  total_interns: number;
  present_today: number;
  absent_today: number;
  total_rendered_hours: number;
  recent: RecentActivity[];
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const formatTime = (time: string | null) => {
    if (!time) return "—";

    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api<Stats>("/admin/stats");

        setStats(response);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-8">
      {/* HERO */}

      <div
        className="
relative

overflow-hidden

rounded-xl

border
border-border

bg-gradient-to-br
from-slate-50
via-background
to-cyan-50/40

p-8
"
      >
        <div
          className="
absolute

right-0
top-0

h-72
w-72

bg-cyan-300/10

blur-3xl
"
        />

        <div
          className="
relative

flex
flex-col

gap-8

lg:flex-row
lg:justify-between
lg:items-center
"
        >
          <div>
            <div
              className="
text-sm

font-semibold

text-cyan-700
"
            >
              Welcome Back
            </div>

            <h1
              className="
mt-3

text-4xl

font-bold
"
            >
              Admin Dashboard
            </h1>

            <p
              className="
mt-3

max-w-2xl

text-muted-foreground
"
            >
              Monitor attendance, reports, rendered hours, and intern activity.
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}

      <div
        className="
grid

gap-5

sm:grid-cols-2
xl:grid-cols-4
"
      >
        <StatCard
          label="Total Interns"
          value={stats?.total_interns ?? "—"}
          icon={<Users className="h-5 w-5" />}
          tone="primary"
        />

        <StatCard
          label="Present Today"
          value={stats?.present_today ?? "—"}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />

        <StatCard
          label="Absent Today"
          value={stats?.absent_today ?? "—"}
          icon={<XCircle className="h-5 w-5" />}
          tone="danger"
        />

        <StatCard
          label="Rendered Hours"
          value={`${Number(stats?.total_rendered_hours ?? 0).toFixed(0)} h`}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* QUICK */}

      <div>
        <div className="mb-5">
          <h2
            className="
text-xl
font-bold
"
          >
            Quick Access
          </h2>

          <p
            className="
text-sm
text-muted-foreground
"
          >
            Frequently used tools
          </p>
        </div>

        <div
          className="
grid

gap-5

md:grid-cols-2
"
        >
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

      <Card
        className="
overflow-hidden
p-0
"
      >
        <div
          className="
border-b

px-6
py-5
"
        >
          <h2
            className="
text-lg
font-semibold
"
          >
            Recent Activity
          </h2>
        </div>

        {loading ? (
          <div className="p-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="
w-full
"
            >
              <thead>
                <tr
                  className="
bg-slate-50

text-xs

uppercase

tracking-wider

text-slate-500
"
                >
                  <th className="px-6 py-4 text-left">Intern</th>

                  <th className="px-6 py-4 text-left">Date</th>

                  <th className="px-6 py-4 text-left">In</th>

                  <th className="px-6 py-4 text-left">Out</th>

                  <th className="px-6 py-4 text-right">Hours</th>
                </tr>
              </thead>

              <tbody>
                {stats?.recent.map((row) => (
                  <tr
                    key={row.id}
                    className="
border-t

hover:bg-slate-50

transition
"
                  >
                    <td className="px-6 py-4 font-medium">{row.fullname}</td>

                    <td className="px-6 py-4">{row.attendance_date}</td>

                    <td className="px-6 py-4">{formatTime(row.time_in)}</td>

                    <td className="px-6 py-4">{formatTime(row.time_out)}</td>

                    <td
                      className="
px-6
py-4

text-right
"
                    >
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
      className="
group

rounded-xl

border
border-border

bg-card

p-6

transition

hover:border-indigo-200

hover:shadow-[0_10px_35px_rgba(0,0,0,.06)]
"
    >
      <div
        className="
flex
justify-between
"
      >
        <div
          className="
rounded-lg

bg-indigo-500/10

p-3

text-indigo-600
"
        >
          {icon}
        </div>

        <ArrowRight
          className="
h-5
w-5

group-hover:text-indigo-600
group-hover:translate-x-1

transition
"
        />
      </div>

      <h3
        className="
mt-6

font-semibold
"
      >
        {title}
      </h3>

      <p
        className="
mt-2

text-sm

text-muted-foreground
"
      >
        {desc}
      </p>
    </Link>
  );
}
