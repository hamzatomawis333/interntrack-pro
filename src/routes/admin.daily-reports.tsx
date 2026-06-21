import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { toast } from "sonner";
import { unreadEvents } from "@/lib/events";

export const Route = createFileRoute("/admin/daily-reports")({
  component: DailyReportsPage,
});

interface Report {
  id: number;
  fullname: string;
  report_text: string;
  report_date: string;
  created_at: string;
  is_seen: number;
}

function DailyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  /* =========================
     LOAD REPORTS (SOURCE OF TRUTH)
  ========================= */
  const loadReports = async () => {
    try {
      setLoading(true);

      const data = await api<Report[]>("/admin/daily-reports");
      setReports(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /* =========================
     MARK AS SEEN (FIXED)
  ========================= */
  const markAsSeen = async (id: number) => {
    try {
      await api(`/admin/daily-reports/${id}/seen`, {
        method: "PATCH",
      });

      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, is_seen: 1 } : r)));

      // 🔥 trigger sidebar refresh
      unreadEvents.emit();

      toast.success("Marked as seen");
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* =========================
     FILTERS
  ========================= */
  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const byName = r.fullname.toLowerCase().includes(search.toLowerCase());

      const byDate = !date || r.report_date.startsWith(date);

      return byName && byDate;
    });
  }, [reports, search, date]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor and review intern submissions in real time.
        </p>
      </div>

      <Card className="overflow-hidden">
        {/* FILTERS */}
        <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search intern..."
            className="h-10 w-full rounded-md border border-input bg-card px-4 text-sm outline-none focus:border-primary"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-md border border-input bg-card px-4 text-sm outline-none focus:border-primary"
          />

          <button
            onClick={() => {
              setSearch("");
              setDate("");
            }}
            className="h-10 rounded-md border px-4 text-sm hover:bg-muted transition"
          >
            Reset
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No reports found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 text-left">Intern</th>
                  <th className="px-6 py-4 text-left">Report</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Submitted</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b transition hover:bg-slate-50 ${
                      r.is_seen === 0 ? "bg-yellow-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-5 font-medium">{r.fullname}</td>

                    <td className="px-6 py-5">
                      <div className="max-w-xl whitespace-pre-wrap text-sm text-muted-foreground">
                        {r.report_text}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-muted-foreground">{r.report_date}</td>

                    <td className="px-6 py-5 text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>

                    <td className="px-6 py-5">
                      {r.is_seen === 1 ? (
                        <span className="inline-flex rounded-md bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                          Seen
                        </span>
                      ) : (
                        <button
                          onClick={() => markAsSeen(r.id)}
                          className="text-xs rounded-md border px-3 py-1 hover:bg-muted transition"
                        >
                          Mark as seen
                        </button>
                      )}
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
