import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  LogOut,
  Clock3,
  FileText,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui-kit";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { unreadEvents } from "@/lib/events";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/attendance", label: "Attendance", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/admin/daily-reports", label: "Daily Reports", icon: <FileText className="h-4 w-4" /> },
  { to: "/admin/users", label: "Interns", icon: <Users className="h-4 w-4" /> },
];

const internNav: NavItem[] = [
  { to: "/intern", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/intern/history", label: "History", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/intern/calendar", label: "Calendar", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/intern/reports", label: "Daily Report", icon: <FileText className="h-4 w-4" /> },
];

export function AppShell({ variant }: { variant: "admin" | "intern" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const nav = variant === "admin" ? adminNav : internNav;

  const [unreadCount, setUnreadCount] = useState(0);

  /* =========================
     LOAD UNREAD COUNT
  ========================= */
  const loadUnread = async () => {
    try {
      const data = await api<{ count: number }>("/admin/daily-reports/unread-count");
      setUnreadCount(data.count);
    } catch (err) {
      console.log(err);
    }
  };

  /* =========================
     POLLING (backup refresh)
  ========================= */
  useEffect(() => {
    if (variant !== "admin") return;

    loadUnread();

    const interval = setInterval(loadUnread, 10000);

    return () => clearInterval(interval);
  }, [variant]);

  /* =========================
     REAL-TIME EVENT SYNC
     (🔥 IMPORTANT PART)
  ========================= */
  useEffect(() => {
    if (variant !== "admin") return;

    const loadUnread = async () => {
      try {
        const data = await api<{ count: number }>("/admin/daily-reports/unread-count");
        setUnreadCount(data.count);
      } catch (err) {
        console.log(err);
      }
    };

    // initial load
    loadUnread();

    // 🔥 WHEN EVENT FIRES → ALWAYS RE-FETCH
    const unsubscribe = unreadEvents.subscribe(async () => {
      await loadUnread();
    });

    return () => unsubscribe();
  }, [variant]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card md:flex">
        {/* BRAND */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">OJT Tracker</div>
            <div className="text-xs text-muted-foreground capitalize">{variant} portal</div>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active =
              item.to === `/${variant}` ? pathname === item.to : pathname.startsWith(item.to);

            const isDailyReports = item.to === "/admin/daily-reports";

            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={`group relative flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`absolute left-0 h-6 w-1 rounded-r-full transition ${
                      active ? "bg-primary opacity-100" : "opacity-0 group-hover:opacity-40"
                    }`}
                  />
                  {item.icon}
                  {item.label}
                </div>

                {/* BADGE */}
                {variant === "admin" && isDailyReports && unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* USER */}
        <div className="border-t border-border p-3">
          <div className="rounded-xl bg-muted/60 px-3 py-2.5">
            <div className="text-sm font-medium">{user?.fullname}</div>
            <div className="text-xs text-muted-foreground">@{user?.username}</div>
          </div>

          <div className="mt-2">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
