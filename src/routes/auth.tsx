import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui-kit";
import { Clock3, ShieldCheck, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import bcrypt from "bcrypt";

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

  // ✅ NEW: admin prompt state
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "intern") {
      navigate({ to: "/intern", replace: true });
      return;
    }

    if (user.role === "admin") {
      const seen = localStorage.getItem("admin_prompt_seen");

      // ONLY redirect if prompt already handled
      if (seen === "true") {
        navigate({ to: "/admin", replace: true });
      }
    }
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api<{ user?: AuthUser; token?: string }>("/auth/login", {
        method: "POST",
        auth: false,
        body: { username, password, role },
      });

      if (!res?.user || !res?.token) {
        throw new Error("Login response is incomplete");
      }

      login(res.user, res.token);

      // ADMIN FLOW
      if (res.user.role === "admin") {
        const seen = localStorage.getItem("admin_prompt_seen");

        if (!seen) {
          setShowAdminPrompt(true);
        } else {
          navigate({ to: "/admin", replace: true });
        }
      }

      // INTERN FLOW
      if (res.user.role === "intern") {
        navigate({ to: "/intern", replace: true });
      }
    } catch (error) {
      toast.error("Unable to log in. Please check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* HERO */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-primary to-[oklch(0.5_0.14_175)] p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
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
            A clean, dependable attendance system for interns and supervisors.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
            <Stat label="Default hours" value="486" />
            <Stat label="Work days" value="Mon–Fri" />
            <Stat label="Roles" value="2" />
          </div>
        </div>

        <p className="text-xs text-white/60">© {new Date().getFullYear()} OJT Tracker</p>
      </div>

      {/* FORM */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in to your account</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose your role and enter your credentials.
          </p>

          {/* ROLE SWITCH */}
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

          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === "admin" ? "admin" : "your username"}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : `Sign in as ${role}`}
            </Button>
          </form>

          {role === "intern" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              New intern?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Create account
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ✅ ADMIN PROMPT MODAL */}
      {showAdminPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-[320px] rounded-xl bg-white p-6 text-center shadow-lg">
            <h2 className="text-lg font-semibold">Change Password?</h2>

            <p className="mt-2 text-sm text-gray-500">
              Do you want to update your admin password now?
            </p>

            <div className="mt-4 flex justify-center gap-2">
              <button
                className="rounded bg-green-500 px-4 py-2 text-white"
                onClick={() => navigate({ to: "/change-password" })}
              >
                Yes
              </button>

              <button
                onClick={() => {
                  console.log("SKIP CLICKED");
                  localStorage.setItem("admin_prompt_seen", "true");
                  setShowAdminPrompt(false);
                  setShowAdminPrompt(false);
                  navigate({ to: "/admin", replace: true });
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* helpers */
type RoleTabProps = {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
};

function RoleTab({ active, onClick, icon, label }: RoleTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium " +
        (active ? "bg-card text-primary" : "text-muted-foreground")
      }
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
      <div className="text-xs text-white/70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
