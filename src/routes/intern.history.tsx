import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Input, PageHeader } from "@/components/ui-kit";
import { fmtTime } from "@/lib/date-utils";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/intern/history")({
  component: HistoryPage,
});

interface Row {
  id: number;
  attendance_date: string;
  day_name: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  source: "auto" | "manual";
}

function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [timeIn, setTimeIn] = useState("08:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [weekly, setWeekly] = useState<{ day: string; hours: number }[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const load = async () => {
    try {
      const data = await api<{ rows: Row[]; weekly: { day: string; hours: number }[] }>(
        "/attendance/history",
      );
      setRows(data.rows);
      setWeekly(data.weekly);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api("/attendance/manual", {
        method: "POST",
        body: { date, time_in: timeIn, time_out: timeOut },
      });

      toast.success("Entry added");
      setShowForm(false);
      setDate("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  };

  const weeklyTotal = (weekly || []).reduce((acc, w) => acc + Number(w.hours || 0), 0);
  const filteredRows = rows.filter((r) => {
    const matchSearch =
      r.attendance_date.toLowerCase().includes(search.toLowerCase()) ||
      r.day_name.toLowerCase().includes(search.toLowerCase());

    const matchSource = sourceFilter === "all" || r.source === sourceFilter;

    return matchSearch && matchSource;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance history"
        description="View your full attendance record and add past entries from your logbook."
        actions={
          <Button onClick={() => setShowForm((v) => !v)} className="text-white">
            <Plus className="h-4 w-4" />
            Add past entry
          </Button>
        }
      />

      {/* FORM */}
      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-4 sm:items-end">
            <Input
              label="Date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <Input
              label="Time in"
              type="time"
              required
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
            />

            <Input
              label="Time out"
              type="time"
              required
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
            />

            <Button type="submit" className="text-white">
              Save entry
            </Button>
          </form>
        </Card>
      )}

      {/* WEEKLY SUMMARY */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">This week</div>
            <div className="text-xs text-muted-foreground">Monday – Friday breakdown</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-semibold text-primary">{weeklyTotal.toFixed(2)} h</div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {(weekly || []).map((w) => (
            <div key={w.day} className="rounded-xl bg-muted/50 p-3 text-center">
              <div className="text-xs font-medium text-muted-foreground">{w.day.slice(0, 3)}</div>

              <div className="mt-1 text-lg font-semibold tabular-nums">
                {Number(w.hours ?? 0).toFixed(1)}
              </div>

              <div className="text-[10px] text-muted-foreground">hours</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search date or day..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="
      h-10
      rounded-md
      border
      px-3
      bg-card
      "
          >
            <option value="all">All Sources</option>
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
          </select>

          <div className="text-sm text-muted-foreground">{filteredRows.length} entries</div>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-0">
        <div className="border-b border-border px-5 py-4 text-sm font-semibold">All entries</div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Day</th>
                  <th className="px-5 py-3 font-medium">Time In</th>
                  <th className="px-5 py-3 font-medium">Time Out</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 text-right font-medium">Hours</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((r) => (
                  <tr key={`${r.source}-${r.id}`} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{r.attendance_date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.day_name}</td>
                    <td className="px-5 py-3 font-mono">{fmtTime(r.time_in)}</td>
                    <td className="px-5 py-3 font-mono">{fmtTime(r.time_out)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-medium " +
                          (r.source === "manual"
                            ? "bg-[oklch(0.95_0.08_75)] text-[oklch(0.45_0.12_75)]"
                            : "bg-primary-soft text-primary")
                        }
                      >
                        {r.source}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">
                      {r.total_hours !== null ? Number(r.total_hours).toFixed(2) : "—"}
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
