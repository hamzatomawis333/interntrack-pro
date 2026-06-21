import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";

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

  // Load reports
  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await api<Report[]>("/admin/daily-reports");
      setReports(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  // Mark single report as seen (NEW ADD)
  const markAsSeen = async (id: number) => {
    try {
      await api(`/admin/daily-reports/${id}/seen`, {
        method: "PATCH",
      });

      // instant UI update (NO refresh needed)
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, is_seen: 1 } : r)));

      toast.success("Marked as seen");
    } catch (err) {
      toast.error("Failed to mark as seen");
    }
  };

  // Filter logic
  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const byName = r.fullname.toLowerCase().includes(search.toLowerCase());
      const byDate = !date || r.report_date.startsWith(date);
      return byName && byDate;
    });
  }, [reports, search, date]);

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Reports" description="Submitted reports of interns." />

      <Card className="overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search intern..."
            className="rounded-xl border px-4 py-2 text-sm"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border px-4 py-2 text-sm"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Intern</th>
                  <th className="px-4 py-3 text-left">Report</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={`border-b ${r.is_seen === 0 ? "bg-yellow-50" : ""}`}>
                    <td className="px-4 py-4">{r.fullname}</td>

                    <td className="px-4 py-4">
                      <div className="max-w-lg whitespace-pre-wrap">{r.report_text}</div>
                    </td>

                    <td className="px-4 py-4">{r.report_date}</td>

                    <td className="px-4 py-4">{new Date(r.created_at).toLocaleString()}</td>

                    {/* STATUS + ACTION (NEW ADD) */}
                    <td className="px-4 py-4">
                      {r.is_seen === 1 ? (
                        <span className="text-green-600 font-medium">Seen</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 font-medium">New</span>

                          <button
                            onClick={() => markAsSeen(r.id)}
                            className="text-xs px-2 py-1 bg-gray-200 rounded"
                          >
                            Mark as seen
                          </button>
                        </div>
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
