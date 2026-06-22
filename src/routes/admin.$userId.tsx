import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/$userId")({
  component: AdminUserAttendancePage,
});

interface Attendance {
  id: number;
  attendance_date: string;
  day_name: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
}

function AdminUserAttendancePage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<Attendance[]>(`/admin/interns/${userId}/attendance`);

        setRows(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const first = new Date(year, month, 1);

  const startDay = first.getDay();

  const days = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= days; d++) {
    cells.push(d);
  }

  const prev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const next = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() =>
            navigate({
              to: "/admin/users",
            })
          }
          className="
            mt-1
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            border
            hover:bg-muted
            transition
          "
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <PageHeader
          title="Intern Attendance"
          description={`Manage attendance for Intern #${userId}`}
        />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_380px] p-6">
          {/* CALENDAR */}
          <div>
            <div className="mb-4">
              <div className="text-lg font-semibold">Attendance Calendar</div>

              <div className="text-sm text-muted-foreground">{monthName}</div>

              <div className="mt-3 flex items-center justify-between">
                <button onClick={prev} className="rounded-lg border px-3 py-1 hover:bg-muted">
                  ←
                </button>

                <button onClick={next} className="rounded-lg border px-3 py-1 hover:bg-muted">
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* EMPTY CELLS */}
              {cells.map((d, i) => {
                if (!d) {
                  return <div key={i} className="aspect-square" />;
                }

                const record = rows.find(
                  (r) =>
                    new Date(r.attendance_date).getDate() === d &&
                    new Date(r.attendance_date).getMonth() === month &&
                    new Date(r.attendance_date).getFullYear() === year,
                );

                return (
                  <button
                    key={i}
                    className={`
              aspect-square
              rounded-xl
              border
              flex
              items-center
              justify-center
              text-sm
              transition

              ${record ? "bg-cyan-500 text-white" : "hover:bg-muted"}
            `}
                  >
                    {d}

                    {record && (
                      <div className="absolute mt-8 text-[10px]">
                        {Number(record.total_hours ?? 0).toFixed(1)}h
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAILS */}
          <div>
            <div className="rounded-xl border p-5">
              <div className="font-semibold">Attendance Details</div>

              <div className="mt-2 text-sm text-muted-foreground">Select a date first.</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AdminUserAttendancePage;
