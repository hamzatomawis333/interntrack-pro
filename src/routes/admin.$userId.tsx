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
  day_name?: string;
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

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);

  // LOAD DATA
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

  // CALENDAR META
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];

  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const formatDate = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

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

  const saveAttendance = async () => {
    if (!selectedDate) return;

    try {
      await api(`/admin/interns/${userId}/attendance`, {
        method: "PUT",
        body: {
          date: selectedDate,
          time_in: selectedRecord?.time_in || null,
          time_out: selectedRecord?.time_out || null,
        },
      });

      toast.success("Saved successfully");

      const updated = await api<Attendance[]>(`/admin/interns/${userId}/attendance`);

      setRows(updated);

      navigate({
        to: "/admin/attendance",
      });
    } catch {
      toast.error("Failed to save attendance");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate({ to: "/admin/users" })}
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <PageHeader
          title="Intern Attendance"
          description={`Manage attendance for Intern #${userId}`}
        />
      </div>

      <Card className="p-6">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_380px]">
          {/* CALENDAR */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <button onClick={prev} className="border px-3 py-1 rounded">
                ←
              </button>

              <div className="font-semibold">
                {first.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <button onClick={next} className="border px-3 py-1 rounded">
                →
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) {
                  return <div key={i} className="aspect-square border rounded" />;
                }

                const dateStr = formatDate(day);

                const record = rows.find((r) => r.attendance_date === dateStr);

                const isSelected = selectedDate === dateStr;

                const weekday = new Date(dateStr).getDay();

                const isWeekend = weekday === 0 || weekday === 6;
                return (
                  <button
                    key={i}
                    disabled={isWeekend}
                    onClick={() => {
                      if (isWeekend) return;

                      setSelectedDate(dateStr);

                      setSelectedRecord(record || null);
                    }}
                    className={`

relative

aspect-square

rounded-xl

border

p-2

transition

flex

flex-col

items-center

justify-center

${record ? "bg-green-50 border-green-300" : ""}

${isSelected ? "ring-2 ring-cyan-500" : ""}

${
  isWeekend
    ? `
bg-red-50
border-red-200
text-red-500
cursor-not-allowed
`
    : `
hover:bg-muted
`
}

`}
                  >
                    <div
                      className="
text-xs
text-muted-foreground
"
                    >
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday]}
                    </div>

                    <div
                      className="
font-semibold
"
                    >
                      {day}
                    </div>

                    {isWeekend && (
                      <div
                        className="
absolute
bottom-1

text-[10px]

font-medium

text-red-500
"
                      >
                        OFF
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* EDIT PANEL */}
          {/* EDIT PANEL */}

          <div className="rounded-xl border p-5">
            <div className="font-semibold">Attendance Details</div>

            {selectedDate ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm">Date</label>

                  <input
                    value={selectedDate}
                    disabled
                    className="
w-full
rounded-xl
border
bg-muted
px-4
py-3
"
                  />
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm">Time In</label>

                    <input
                      type="time"
                      step="60"
                      value={selectedRecord?.time_in?.slice(0, 5) ?? ""}
                      onChange={(e) =>
                        setSelectedRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                time_in: e.target.value,
                              }
                            : {
                                id: 0,
                                attendance_date: selectedDate,
                                time_in: e.target.value,
                                time_out: null,
                                total_hours: null,
                              },
                        )
                      }
                      className="
w-full
rounded-xl
border
px-4
py-3
"
                    />

                    <div className="mt-1 text-xs text-muted-foreground">
                      {selectedRecord?.time_in
                        ? new Date(`2000-01-01T${selectedRecord.time_in}`).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "Select time"}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm">Time Out</label>

                    <input
                      type="time"
                      step="60"
                      value={selectedRecord?.time_out?.slice(0, 5) ?? ""}
                      onChange={(e) =>
                        setSelectedRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                time_out: e.target.value,
                              }
                            : {
                                id: 0,
                                attendance_date: selectedDate,
                                time_in: null,
                                time_out: e.target.value,
                                total_hours: null,
                              },
                        )
                      }
                      className="
w-full
rounded-xl
border
px-4
py-3
"
                    />

                    <div className="mt-1 text-xs text-muted-foreground">
                      {selectedRecord?.time_out
                        ? new Date(`2000-01-01T${selectedRecord.time_out}`).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "Select time"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={saveAttendance}
                  className="
mt-6
w-full
rounded-xl
bg-cyan-600
py-3
font-medium
text-white
hover:bg-cyan-700
"
                >
                  Save Attendance
                </button>
              </div>
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">Select a day from calendar</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
