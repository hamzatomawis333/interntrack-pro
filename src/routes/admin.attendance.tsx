import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { fmtTime } from "@/lib/date-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/attendance")({
  component: AttendancePage,
});

interface Row {
  id: number;
  fullname: string;
  attendance_date: string;
  day_name: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  status: string;
}

function AttendancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");

  const load = async (): Promise<void> => {
    setLoading(true);

    try {
      const q = new URLSearchParams();

      if (name) q.set("name", name);
      if (date) q.set("date", date);
      if (month) q.set("month", month);

      const data = await api<Row[]>(`/admin/attendance?${q.toString()}`);

      setRows(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Monitoring</h1>

        <p className="mt-2 text-muted-foreground">Review and manage intern attendance records.</p>
      </div>

      {/* FILTER */}

      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
          className="
grid
gap-4

md:grid-cols-2
xl:grid-cols-[1fr_220px_220px_auto]
"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Intern Name</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Search intern..."
              className="
h-10
w-full

rounded-md

border
border-input

bg-card

px-4

outline-none

focus:border-primary
"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="
h-10
w-full

rounded-md

border
border-input

bg-card

px-4
"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Month</label>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="
h-10
w-full

rounded-md

border
border-input

bg-card

px-4
"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="
h-10

rounded-md

bg-primary

px-5

font-medium

text-primary-foreground

hover:bg-primary/90

transition
"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={() => {
                setName("");
                setDate("");
                setMonth("");

                setTimeout(load, 0);
              }}
              className="
h-10

rounded-md

border
border-border

px-5

hover:bg-muted

transition
"
            >
              Reset
            </button>
          </div>
        </form>
      </Card>

      {/* TABLE */}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="
border-b

bg-muted/20

text-xs
uppercase

tracking-wider

text-muted-foreground
"
                >
                  <th className="px-6 py-4 text-left">Intern</th>

                  <th className="px-6 py-4 text-left">Date</th>

                  <th className="px-6 py-4 text-left">Day</th>

                  <th className="px-6 py-4 text-left">Time In</th>

                  <th className="px-6 py-4 text-left">Time Out</th>

                  <th className="px-6 py-4 text-left">Hours</th>

                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="
border-b

hover:bg-muted/20

transition
"
                  >
                    <td className="px-6 py-5 font-medium">{row.fullname}</td>

                    <td className="px-6 py-5">{row.attendance_date}</td>

                    <td className="px-6 py-5">{row.day_name}</td>

                    <td className="px-6 py-5 font-mono">{fmtTime(row.time_in)}</td>

                    <td className="px-6 py-5 font-mono">{fmtTime(row.time_out)}</td>

                    <td className="px-6 py-5">
                      {Number.isFinite(Number(row.total_hours))
                        ? Number(row.total_hours).toFixed(2)
                        : "—"}
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge status={row.status} />
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

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "present"
      ? "bg-green-500/10 text-green-600"
      : status === "incomplete"
        ? "bg-orange-500/10 text-orange-600"
        : "bg-red-500/10 text-red-600";

  return (
    <span
      className={`
inline-flex

rounded-md

px-3
py-1

text-xs
font-semibold

capitalize

${cls}
`}
    >
      {status}
    </span>
  );
}
