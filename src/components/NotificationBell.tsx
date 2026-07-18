import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { unreadEvents } from "@/lib/events";
import {
  Bell,
  UserPlus,
  Clock,
  FileText,
  Mail,
  Settings,
  Shield,
  Check,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  description: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  registration: { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
  attendance: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  daily_report: { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
  email: { icon: Mail, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  system: { icon: Settings, color: "text-slate-500", bg: "bg-slate-500/10" },
  audit: { icon: Shield, color: "text-rose-500", bg: "bg-rose-500/10" },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fastRefresh, setFastRefresh] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  const loadUnread = useCallback(async () => {
    try {
      const data = await api<{ count: number }>("/admin/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {
      // silently ignore
    }
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api<{ notifications: Notification[]; total: number }>(
        "/admin/notifications?limit=8",
      );
      setNotifications(data.notifications);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerFastRefresh = useCallback(() => {
    setFastRefresh(true);
    clearTimeout(fastTimerRef.current);
    fastTimerRef.current = setTimeout(() => setFastRefresh(false), 5000);
  }, []);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(
      () => {
        loadUnread();
        if (open) loadRecent();
      },
      fastRefresh ? 1000 : 15000,
    );
    return () => clearInterval(interval);
  }, [open, fastRefresh, loadUnread, loadRecent]);

  useEffect(() => {
    const unsub = unreadEvents.subscribe(() => {
      loadUnread();
      triggerFastRefresh();
    });
    return unsub;
  }, [loadUnread, triggerFastRefresh]);

  useEffect(() => {
    if (!open) return;
    loadRecent();
  }, [open, loadRecent]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markRead = async (id: number) => {
    try {
      await api(`/admin/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      triggerFastRefresh();
      unreadEvents.emit();
    } catch {
      // silently ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api("/admin/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      triggerFastRefresh();
      unreadEvents.emit();
    } catch {
      // silently ignore
    }
  };

  const handleClickNotification = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
    }
    setOpen(false);
    if (n.link) {
      navigate({ to: n.link });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-80 rounded-xl border border-white/10 bg-navy-sidebar shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/40">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/40">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = getConfig(n.notification_type);
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`flex items-start gap-3 border-b border-white/5 px-4 py-3 transition hover:bg-white/5 ${
                      !n.is_read ? "bg-white/5" : ""
                    } ${n.link ? "cursor-pointer" : ""}`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${!n.is_read ? "font-medium text-white" : "text-white/70"}`}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(n.id);
                            }}
                            className="mt-0.5 shrink-0 text-white/30 transition hover:text-white"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-white/40 line-clamp-2">{n.description}</p>
                      <span className="mt-1 block text-[10px] text-white/30">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-2.5">
            <Link
              to="/admin/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-white/60 transition hover:text-white"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
