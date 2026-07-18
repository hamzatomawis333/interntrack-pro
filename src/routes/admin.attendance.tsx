import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { fmtTime } from "@/lib/date-utils";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/attendance")({
  component: AttendancePage,
});

interface Row {
  id: number;
  fullname: string;

  date: string;
  day_name: string;

  time_in: string | null;
  time_out: string | null;

  hours: number | null;

  status: string;

  source?: string;
}

function AttendancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const totalRecords = rows.length;

  const totalPresent = rows.filter((r) => r.status === "present").length;
  const totalHours = rows.reduce((sum, r) => sum + Number(r.hours || 0), 0);
  const deleteRow = async (id: number) => {
    if (!confirm("Delete this attendance record?")) return;

    try {
      await api(`/admin/attendance/${id}`, {
        method: "DELETE",
      });

      toast.success("Deleted successfully");

      await load();
    } catch {
      toast.error("Failed to delete");
    }
  };

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

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <div className="text-sm">Records</div>
          <div className="text-3xl font-bold">{totalRecords}</div>
        </Card>

        <Card className="p-5">
          <div className="text-sm">Present</div>
          <div className="text-3xl font-bold text-green-600">{totalPresent}</div>
        </Card>

        <Card className="p-5">
          <div className="text-sm">Average Hours</div>

          <div className="text-3xl font-bold">
            {rows.length ? (totalHours / rows.length).toFixed(1) : "0"}h
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm">Hours</div>
          <div className="text-3xl font-bold">{totalHours.toFixed(1)}h</div>
        </Card>
      </div>

      {selected && (
        <Card className="overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Attendance Details</h2>

                <p className="text-sm text-muted-foreground">Selected attendance record</p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="
rounded-md
border
px-3
py-2
text-sm
hover:bg-muted
transition
"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Intern</div>

              <div className="mt-2 font-semibold">{selected.fullname}</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Date</div>

              <div className="mt-2 font-semibold">{selected.date}</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Day</div>

              <div className="mt-2 font-semibold">
                {selected.day_name?.trim()
                  ? selected.day_name
                  : new Date(selected.date).toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Time In</div>

              <div className="mt-2 font-semibold">{fmtTime(selected.time_in)}</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Time Out</div>

              <div className="mt-2 font-semibold">{fmtTime(selected.time_out)}</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Rendered Hours</div>

              <div className="mt-2 font-semibold">{Number(selected.hours || 0).toFixed(2)} h</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Status</div>

              <div className="mt-2">
                <StatusBadge status={selected.status} />
              </div>
            </div>
          </div>
        </Card>
      )}
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
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className="
cursor-pointer
border-b
hover:bg-muted/20
transition
"
                  >
                    <td className="px-6 py-5 font-medium">{row.fullname}</td>

                    <td className="px-6 py-5">{row.date}</td>

                    <td className="px-6 py-5">
                      {row.day_name?.trim()
                        ? row.day_name
                        : new Date(row.date).toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                    </td>

                    <td className="px-6 py-5 font-mono">{fmtTime(row.time_in)}</td>

                    <td className="px-6 py-5 font-mono">{fmtTime(row.time_out)}</td>

                    <td className="px-6 py-5">{Number(row.hours || 0).toFixed(2)}</td>

                    <td className="px-6 py-5">
                      <StatusBadge status={row.status} />
                    </td>

                    <td className="px-6 py-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRow(row.id);
                        }}
                        className="
inline-flex
items-center
gap-2

rounded-md

bg-red-500/10

px-3
py-2

text-xs
font-semibold

text-red-600

hover:bg-red-500/20

transition
"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
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
