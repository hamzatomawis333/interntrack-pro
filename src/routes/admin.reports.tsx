import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

interface Row {
  id: number;
  fullname: string;
  username: string;
  required_hours: number;
  rendered_hours: number;
}

function ReportsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExports, setShowExports] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await api<Row[]>("/admin/reports");
        setRows(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExports(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportExcel = () => {
    const data = rows.map((r) => {
      const rendered = Number(r.rendered_hours ?? 0);
      const remaining = Math.max(0, r.required_hours - rendered);
      const pct = Math.min(100, (rendered / r.required_hours) * 100);
      return {
        Intern: r.fullname,
        Username: r.username,
        "Required Hours": r.required_hours,
        "Rendered Hours": rendered.toFixed(2),
        "Remaining Hours": remaining.toFixed(2),
        "Progress %": pct.toFixed(0) + "%",
      };
    });
    exportToExcel(data, "intern-progress-report");
    setShowExports(false);
    toast.success("Excel exported");
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: "Intern Progress Report",
      subtitle: "Current rendered vs required hours",
      headers: ["Intern", "Username", "Required", "Rendered", "Remaining", "Progress"],
      rows: rows.map((r) => {
        const rendered = Number(r.rendered_hours ?? 0);
        const remaining = Math.max(0, r.required_hours - rendered);
        const pct = Math.min(100, (rendered / r.required_hours) * 100);
        return [
          r.fullname,
          r.username,
          `${r.required_hours}h`,
          `${rendered.toFixed(2)}h`,
          `${remaining.toFixed(2)}h`,
          `${pct.toFixed(0)}%`,
        ];
      }),
      totalRecords: rows.length,
      filename: "intern-progress-report",
    });
    setShowExports(false);
    toast.success("PDF exported");
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-cyan-700">Analytics</div>
          <h1 className="mt-2 text-4xl font-bold">Progress Reports</h1>
          <p className="mt-3 text-muted-foreground">
            Track rendered, remaining, and completion progress.
          </p>
        </div>

        {/* EXPORT */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExports(!showExports)}
            disabled={loading || rows.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          {showExports && (
            <div className="absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <button
                onClick={handleExportExcel}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Export as Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition"
              >
                <FileText className="h-4 w-4 text-red-500" />
                Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No interns yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-6 py-5 text-left">Intern</th>
                  <th className="px-6 py-5 text-right">Required</th>
                  <th className="px-6 py-5 text-right">Rendered</th>
                  <th className="px-6 py-5 text-right">Remaining</th>
                  <th className="px-6 py-5">Progress</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rendered = Number(row.rendered_hours ?? 0);
                  const remaining = Math.max(0, row.required_hours - rendered);
                  const pct = Math.min(100, (rendered / row.required_hours) * 100);

                  return (
                    <tr key={row.id} className="border-b hover:bg-muted transition">
                      <td className="px-6 py-5">
                        <div className="font-semibold">{row.fullname}</div>
                        <div className="mt-1 text-xs text-muted-foreground">@{row.username}</div>
                      </td>
                      <td className="px-6 py-5 text-right tabular-nums">{row.required_hours}h</td>
                      <td className="px-6 py-5 text-right font-semibold text-cyan-700 tabular-nums">
                        {rendered.toFixed(2)}h
                      </td>
                      <td className="px-6 py-5 text-right tabular-nums">{remaining.toFixed(2)}h</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className="h-[7px] flex-1 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={Math.round(pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${row.fullname} progress: ${pct.toFixed(0)}%`}
                          >
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-14 text-right text-sm font-semibold text-cyan-700">
                            {pct.toFixed(0)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
