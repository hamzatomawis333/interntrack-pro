import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Input, PageHeader } from "@/components/ui-kit";
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

  const load = async () => {
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance monitoring"
        description="Review and filter all intern attendance records."
      />

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="grid gap-3 sm:grid-cols-4"
        >
          <Input
            label="Intern name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by name"
          />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label="Month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
              className="h-11 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Reset
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No records match.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Intern</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Day</th>
                  <th className="px-5 py-3 font-medium">Time In</th>
                  <th className="px-5 py-3 font-medium">Time Out</th>
                  <th className="px-5 py-3 font-medium">Hours</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{r.fullname}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.attendance_date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.day_name}</td>
                    <td className="px-5 py-3 font-mono">{fmtTime(r.time_in)}</td>
                    <td className="px-5 py-3 font-mono">{fmtTime(r.time_out)}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {r.total_hours != null ? Number(r.total_hours).toFixed(2) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
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
      ? "bg-[oklch(0.93_0.07_155)] text-[oklch(0.4_0.12_155)]"
      : status === "incomplete"
        ? "bg-[oklch(0.95_0.08_75)] text-[oklch(0.45_0.12_75)]"
        : "bg-[oklch(0.95_0.06_25)] text-[oklch(0.5_0.18_25)]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}
