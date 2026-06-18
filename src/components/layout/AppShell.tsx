import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, ClipboardList, BarChart3, Users, LogOut, Clock3 } from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  // typed loosely; TanStack Link accepts any registered path at runtime
  to: string;
  label: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/attendance", label: "Attendance", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/admin/users", label: "Interns", icon: <Users className="h-4 w-4" /> },
];

const internNav: NavItem[] = [
  { to: "/intern", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/intern/history", label: "History", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/intern/calendar", label: "Calendar", icon: <BarChart3 className="h-4 w-4" /> },
];

export function AppShell({ variant, children }: { variant: "admin" | "intern"; children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = variant === "admin" ? adminNav : internNav;

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">OJT Tracker</div>
            <div className="text-xs text-muted-foreground capitalize">{variant} portal</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active =
              item.to === `/${variant}`
                ? pathname === item.to
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 rounded-xl bg-muted/60 px-3 py-2.5">
            <div className="truncate text-sm font-medium">{user?.fullname}</div>
            <div className="truncate text-xs text-muted-foreground">@{user?.username}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock3 className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">OJT Tracker</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-muted-foreground">
          Sign out
        </button>
      </header>

      <nav className="sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
        {nav.map((item) => {
          const active =
            item.to === `/${variant}` ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to as never}
              className={
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                (active ? "bg-primary-soft text-primary" : "text-muted-foreground")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
