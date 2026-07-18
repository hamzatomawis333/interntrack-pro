import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";
import {
  Search,
  X,
  Shield,
  UserMinus,
  Clock,
  Trash2,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditLogsPage,
});

interface AuditLog {
  id: number;
  admin_id: number | null;
  admin_name: string;
  admin_username: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, typeof Shield> = {
  delete_intern: UserMinus,
  update_hours: Clock,
  delete_attendance: Trash2,
  mark_report_seen: Eye,
  submit_report: FileText,
  login: Shield,
  logout: Shield,
  register: Shield,
  change_password: Shield,
  update_profile: Shield,
};

const ACTION_LABELS: Record<string, string> = {
  delete_intern: "Deleted Intern",
  update_hours: "Updated Hours",
  delete_attendance: "Deleted Attendance",
  mark_report_seen: "Marked Report Seen",
  submit_report: "Submitted Report",
  login: "Login",
  logout: "Logout",
  register: "Registration",
  change_password: "Password Change",
  update_profile: "Profile Update",
};

function formatAction(action: string) {
  return (
    ACTION_LABELS[action] || action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const limit = 20;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionFilter) params.set("action", actionFilter);

      const data = await api<{
        logs: AuditLog[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/audit-logs?${params.toString()}`);

      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actionFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="Track all admin actions and system events." />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-9 text-sm shadow-(--shadow-soft) outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm shadow-(--shadow-soft) outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All actions</option>
            <option value="delete_intern">Delete Intern</option>
            <option value="update_hours">Update Hours</option>
            <option value="delete_attendance">Delete Attendance</option>
            <option value="login">Login</option>
            <option value="register">Registration</option>
            <option value="change_password">Password Change</option>
            <option value="update_profile">Profile Update</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = ACTION_ICONS[log.action] || Shield;
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border transition hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium">{formatAction(log.action)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.admin_name}
                        {log.admin_username && (
                          <span className="ml-1 text-xs">@{log.admin_username}</span>
                        )}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                        {log.details || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
