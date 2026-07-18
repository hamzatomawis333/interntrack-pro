import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  LogOut,
  Clock3,
  FileText,
  Sun,
  Moon,
  Palette,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui-kit";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { unreadEvents } from "@/lib/events";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  {
    to: "/admin/attendance",
    label: "Attendance Monitoring",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  { to: "/admin/reports", label: "Intern Progress", icon: <BarChart3 className="h-4 w-4" /> },
  {
    to: "/admin/daily-reports",
    label: "Intern Daily Reports",
    icon: <FileText className="h-4 w-4" />,
  },
  { to: "/admin/users", label: "Manage Interns", icon: <Users className="h-4 w-4" /> },
];

const internNav: NavItem[] = [
  { to: "/intern", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/intern/history", label: "History", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/intern/calendar", label: "Calendar", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/intern/reports", label: "Daily Report", icon: <FileText className="h-4 w-4" /> },
];

export function AppShell({
  variant,
  children,
}: {
  variant: "admin" | "intern";
  children?: ReactNode;
}) {
  const { user, logout } = useAuth();
  const { dark, toggleDark, accentIndex, setAccent, accentPresets } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const nav = variant === "admin" ? adminNav : internNav;

  const [unreadCount, setUnreadCount] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadUnread = useCallback(async () => {
    try {
      const data = await api<{ count: number }>("/admin/daily-reports/unread-count");
      setUnreadCount(data.count);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (variant !== "admin") return;

    loadUnread();
    const interval = setInterval(loadUnread, 10000);

    const unsubscribe = unreadEvents.subscribe(() => {
      loadUnread();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [variant, loadUnread]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth" });
  };

  const sidebarContent = (
    <>
      {/* BRAND */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
          <Clock3 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">OJT Tracker</div>
          <div className="text-xs text-white/60 capitalize">{variant} portal</div>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`absolute left-0 h-6 w-1 rounded-r-full transition ${
                    active ? "bg-white opacity-100" : "opacity-0 group-hover:opacity-40"
                  }`}
                />
                {item.icon}
                {item.label}
              </div>

              {variant === "admin" && isDailyReports && unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* CONTROLS + USER */}
      <div className="border-t border-white/10 p-3">
        {/* THEME CONTROLS */}
        <div className="mb-3 flex items-center gap-1">
          <button
            onClick={toggleDark}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowColorPicker((p) => !p)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Accent color"
            >
              <Palette className="h-4 w-4" />
            </button>

            {showColorPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-44 rounded-xl border border-white/10 bg-navy-sidebar p-3 shadow-xl">
                <div className="mb-2 text-xs font-medium text-white/60">Accent Color</div>
                <div className="grid grid-cols-6 gap-1.5">
                  {accentPresets.map((p, i) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setAccent(i);
                        setShowColorPicker(false);
                      }}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        accentIndex === i
                          ? "border-white scale-110"
                          : "border-transparent hover:scale-110"
                      }`}
                      title={p.label}
                    >
                      <span
                        className="block h-full w-full rounded-full"
                        style={{
                          backgroundColor: [
                            "#22c55e",
                            "#3b82f6",
                            "#a855f7",
                            "#f97316",
                            "#ef4444",
                            "#14b8a6",
                          ][i],
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* USER INFO */}
        <div className="rounded-xl bg-white/8 px-3 py-2.5">
          <div className="text-sm font-medium text-white">{user?.fullname}</div>
          <div className="text-xs text-white/50">@{user?.username}</div>
        </div>

        <div className="mt-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-navy-sidebar text-white md:flex">
        {sidebarContent}
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      {isMobile && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-navy-sidebar text-white transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>
      )}

      {/* MOBILE TOP BAR */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">OJT Tracker</span>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className={`${isMobile ? "pt-14" : "md:pl-64"}`}>
        <div className={`mx-auto max-w-6xl px-4 py-6 ${isMobile ? "" : "md:px-8 md:py-10"}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
