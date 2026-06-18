import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui-kit";
import { Clock3, ShieldCheck, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "intern">("intern");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (user.must_change_password) navigate({ to: "/change-password", replace: true });
    else navigate({ to: user.role === "admin" ? "/admin" : "/intern", replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api<{ user: AuthUser; token: string }>("/auth/login", {
        method: "POST",
        auth: false,
        body: { username, password, role },
      });
      login(res.user, res.token);
      toast.success(`Welcome, ${res.user.fullname}`);
      if (res.user.must_change_password) navigate({ to: "/change-password", replace: true });
      else navigate({ to: res.user.role === "admin" ? "/admin" : "/intern", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Hero panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-[oklch(0.5_0.14_175)] p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Clock3 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">OJT Tracker</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Track every hour of your on-the-job training.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            A clean, dependable attendance system for interns and supervisors. Time in, time out,
            and watch your required hours add up.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
            <Stat label="Default hours" value="486" />
            <Stat label="Work days" value="Mon–Fri" />
            <Stat label="Roles" value="2" />
          </div>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} OJT Tracker</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Clock3 className="h-5 w-5" />
            </div>
            <span className="font-semibold">OJT Tracker</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your role and enter your credentials.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-1.5">
            <RoleTab
              active={role === "intern"}
              onClick={() => setRole("intern")}
              icon={<GraduationCap className="h-4 w-4" />}
              label="Intern"
            />
            <RoleTab
              active={role === "admin"}
              onClick={() => setRole("admin")}
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Admin"
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === "admin" ? "admin" : "your username"}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : `Sign in as ${role === "admin" ? "Admin" : "Intern"}`}
            </Button>
          </form>

          {role === "intern" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              New intern?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          )}
          {role === "admin" && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Default admin: <code className="rounded bg-muted px-1.5 py-0.5">admin / admin</code> —
              you'll be asked to change the password on first login.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all " +
        (active
          ? "bg-card text-primary shadow-[var(--shadow-soft)]"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur">
      <div className="text-xs text-white/70">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}
