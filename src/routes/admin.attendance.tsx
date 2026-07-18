import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { fmtTime } from "@/lib/date-utils";
import { toast } from "sonner";
import { Trash2, X, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

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

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function AttendancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [showExports, setShowExports] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const debouncedName = useDebounce(name, 300);

  const totalRecords = rows.length;
  const totalPresent = rows.filter((r) => r.status === "present").length;
  const totalHours = rows.reduce((sum, r) => sum + Number(r.hours || 0), 0);

  const deleteRow = async (id: number) => {
    if (!confirm("Delete this attendance record?")) return;
    try {
      await api(`/admin/attendance/${id}`, { method: "DELETE" });
      toast.success("Deleted successfully");
      await load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const load = useCallback(async (): Promise<void> => {
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
  }, [name, date, month]);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (debouncedName !== undefined) {
      void load();
    }
  }, [debouncedName]);

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
    const data = rows.map((r) => ({
      Intern: r.fullname,
      Date: r.date,
      Day: r.day_name || new Date(r.date).toLocaleDateString("en-US", { weekday: "long" }),
      "Time In": fmtTime(r.time_in),
      "Time Out": fmtTime(r.time_out),
      Hours: Number(r.hours || 0).toFixed(2),
      Status: r.status,
    }));
    exportToExcel(data, "attendance-report");
    setShowExports(false);
    toast.success("Excel exported");
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: "Attendance Report",
      subtitle: `Filtered by: ${name || "All"} ${date ? `| Date: ${date}` : ""} ${month ? `| Month: ${month}` : ""}`,
      headers: ["Intern", "Date", "Day", "Time In", "Time Out", "Hours", "Status"],
      rows: rows.map((r) => [
        r.fullname,
        r.date,
        r.day_name || new Date(r.date).toLocaleDateString("en-US", { weekday: "long" }),
        fmtTime(r.time_in),
        fmtTime(r.time_out),
        Number(r.hours || 0).toFixed(2),
        r.status,
      ]),
      totalRecords,
      filename: "attendance-report",
    });
    setShowExports(false);
    toast.success("PDF exported");
  };

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
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_220px_220px_auto]"
        >
          <div className="relative">
            <label className="mb-2 block text-sm font-medium">Intern Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Search intern..."
              className="h-10 w-full rounded-md border border-input bg-card px-4 pr-9 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
            {name && (
              <button
                type="button"
                onClick={() => setName("")}
                className="absolute right-2 top-[34px] rounded p-1 text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-4 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-4 text-sm"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
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
              className="h-10 rounded-md border border-border px-5 text-sm hover:bg-muted transition"
            >
              Reset
            </button>
          </div>
        </form>
      </Card>

      {/* SUMMARY + EXPORT */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid flex-1 gap-4 grid-cols-2 sm:grid-cols-4">
          <Card className="p-5">
            <div className="text-sm text-muted-foreground">Records</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{totalRecords}</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-muted-foreground">Present</div>
            <div className="mt-1 text-3xl font-bold text-green-600 tabular-nums">
              {totalPresent}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-muted-foreground">Average Hours</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {rows.length ? (totalHours / rows.length).toFixed(1) : "0"}h
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-muted-foreground">Hours</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{totalHours.toFixed(1)}h</div>
          </Card>
        </div>

        {/* EXPORT DROPDOWN */}
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

      {/* DETAIL PANEL */}
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
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition"
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
                  : new Date(selected.date).toLocaleDateString("en-US", { weekday: "long" })}
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

      {/* TABLE */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <div className="text-sm">No attendance records found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
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
                    className="cursor-pointer border-b hover:bg-muted/20 transition"
                  >
                    <td className="px-6 py-5 font-medium">{row.fullname}</td>
                    <td className="px-6 py-5">{row.date}</td>
                    <td className="px-6 py-5">
                      {row.day_name?.trim()
                        ? row.day_name
                        : new Date(row.date).toLocaleDateString("en-US", { weekday: "long" })}
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
                        className="inline-flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition"
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
    <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}

function Inbox(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
