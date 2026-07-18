import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";
import {
  Search,
  X,
  Bell,
  UserPlus,
  Clock,
  FileText,
  Mail,
  Settings,
  Shield,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotificationsPage,
});

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  description: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> =
  {
    registration: {
      icon: UserPlus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      label: "Registration",
    },
    attendance: {
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      label: "Attendance",
    },
    daily_report: {
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      label: "Daily Report",
    },
    email: { icon: Mail, color: "text-cyan-500", bg: "bg-cyan-500/10", label: "Email" },
    system: { icon: Settings, color: "text-slate-500", bg: "bg-slate-500/10", label: "System" },
    audit: { icon: Shield, color: "text-rose-500", bg: "bg-rose-500/10", label: "Audit Log" },
  };

function getConfig(type: string) {
  return (
    TYPE_CONFIG[type] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted", label: type }
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [fastRefresh, setFastRefresh] = useState(false);
  const fastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedSearch = useDebouncedValue(search);
  const limit = 15;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter) params.set("type", typeFilter);
      if (readFilter !== "") params.set("is_read", readFilter);

      const data = await api<{
        notifications: Notification[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/notifications?${params.toString()}`);

      setNotifications(data.notifications);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, readFilter]);

  const loadUnread = useCallback(async () => {
    try {
      const data = await api<{ count: number }>("/admin/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {
      // silently ignore
    }
  }, []);

  const triggerFastRefresh = useCallback(() => {
    setFastRefresh(true);
    clearTimeout(fastTimerRef.current);
    fastTimerRef.current = setTimeout(() => setFastRefresh(false), 5000);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, fastRefresh ? 1000 : 15000);
    return () => clearInterval(interval);
  }, [loadUnread, fastRefresh, notifications]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, readFilter]);

  const markRead = async (id: number) => {
    try {
      await api(`/admin/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      triggerFastRefresh();
      loadNotifications();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await api("/admin/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      triggerFastRefresh();
      loadNotifications();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api(`/admin/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`Stay updated with system activity.${unreadCount > 0 ? ` ${unreadCount} unread.` : ""}`}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-(--shadow-elevated)"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notifications..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm shadow-(--shadow-soft) outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm shadow-(--shadow-soft) outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All</option>
            <option value="0">Unread</option>
            <option value="1">Read</option>
          </select>
        </div>
      </Card>

      {/* Notification list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-72 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications found.</p>
          </Card>
        ) : (
          notifications.map((n) => {
            const cfg = getConfig(n.notification_type);
            const Icon = cfg.icon;
            const cardContent = (
              <>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
                >
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    {!n.is_read && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              </>
            );

            const cardClasses = `group flex items-start gap-3 p-4 transition hover:shadow-[var(--shadow-elevated)] ${
              n.link ? "cursor-pointer" : ""
            } ${!n.is_read ? "border-l-2 border-l-primary" : ""}`;

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => {
                    if (!n.is_read) markRead(n.id);
                  }}
                  className={cardClasses}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <Card key={n.id} className={cardClasses}>
                {cardContent}
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="flex items-center justify-between p-3">
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
        </Card>
      )}
    </div>
  );
}
