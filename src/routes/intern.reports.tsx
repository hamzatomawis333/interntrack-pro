import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/intern/reports")({
  component: ReportsPage,
});

interface Report {
  id: number;
  report_text: string;
  created_at: string;
}

function ReportsPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);

  const loadReports = async () => {
    try {
      const data = await api<Report[]>("/reports/my");
      setReports(data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load reports");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const submitReport = async () => {
    const cleanText = text.trim();

    if (!cleanText) {
      toast.error("Please write a report");
      return;
    }

    setLoading(true);

    try {
      await api("/reports", {
        method: "POST",
        body: { report_text: cleanText },
      });

      toast.success("Report submitted!");

      setText("");
      await loadReports(); // refresh list
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
        <p className="text-sm text-muted-foreground">
          Submit your daily output and track your submitted reports.
        </p>
      </div>

      {/* GRID LAYOUT (better spacing control) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* LEFT: SUBMIT */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <textarea
              className="min-h-[160px] w-full resize-none rounded-lg border bg-background p-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="Write your daily report here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{text.length}/1000 characters</span>

              <button
                onClick={submitReport}
                disabled={loading || !text.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>

          {/* QUICK STATS CARD (optional but looks premium) */}
          <div className="rounded-xl border bg-card p-4 text-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Reports</span>
              <span className="font-semibold">{reports.length}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: REPORT LIST */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-sm font-semibold">My Reports</h2>
            <span className="text-xs text-muted-foreground">{reports.length} entries</span>
          </div>

          <div className="max-h-[520px] space-y-3 overflow-auto p-4">
            {fetching ? (
              <div className="text-sm text-muted-foreground">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="text-sm text-muted-foreground">No reports submitted yet.</div>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border bg-muted/20 p-3 transition hover:bg-muted/40"
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{r.report_text}</div>

                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
