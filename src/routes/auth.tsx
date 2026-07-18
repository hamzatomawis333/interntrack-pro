import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Input, PasswordInput } from "@/components/ui-kit";
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
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "intern") {
      navigate({ to: "/intern", replace: true });
      return;
    }

    if (user.role === "admin") {
      const seen = localStorage.getItem("admin_prompt_seen");

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

      if (res.user.role === "admin") {
        const seen = localStorage.getItem("admin_prompt_seen");

        if (!seen) {
          setShowAdminPrompt(true);
        } else {
          navigate({ to: "/admin", replace: true });
        }
      }

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
    <div
      className="relative grid min-h-screen lg:grid-cols-2 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/ictologo2.jpg')" }}
    >
      {/* CINEMATIC OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/80" />

      {/* FLOATING GLOW EFFECTS */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />

      {/* HERO SIDE */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 backdrop-blur">
            <Clock3 className="h-5 w-5 text-blue-200" />
          </div>

          <div>
            <div className="text-lg font-bold tracking-wide">ICTO System</div>
            <div className="text-sm text-white/60">
              Information & Communication Technology Office
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Intern Attendance & Monitoring System
          </h1>

          <p className="mt-4 max-w-md text-white/70 leading-relaxed">
            Track attendance, monitor rendered hours, submit reports, and manage interns in one
            system.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-lg hover:bg-white/15 transition-all">
              <div className="text-xs text-white/60 tracking-wide">Work days</div>

              <div className="text-white font-semibold mt-2 text-lg tracking-tight">
                Monday - Friday
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40">© {new Date().getFullYear()} ICTO Internship System</p>
      </div>

      {/* LOGIN SIDE */}
      <div className="relative flex items-center justify-center px-6 sm:px-10">
        <div
          className="
            w-full max-w-md
            rounded-3xl
            border border-white/15
            bg-white/10
            backdrop-blur-2xl
            p-9
            text-white
            shadow-[0_40px_120px_rgba(0,0,0,0.65)]
          "
        >
          <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>

          <p className="mt-1 text-sm text-white/60">Sign in to continue your dashboard</p>

          {/* ROLE SWITCH */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 border border-white/10 p-1.5">
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
              placeholder="Enter username"
              required
              labelClassName="text-white/90"
              className="text-white"
            />

            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              labelClassName="text-white/90"
              className="text-white"
            />

            <Button
              type="submit"
              disabled={submitting}
              className="
                h-12 w-full rounded-2xl
                bg-gradient-to-r from-[#0B1F3B] to-[#1E3A8A]
                text-white font-medium
                transition-all hover:scale-[1.02] hover:shadow-2xl
              "
            >
              {submitting ? "Signing in..." : `Sign in as ${role}`}
            </Button>
          </form>

          {role === "intern" && (
            <p className="mt-6 text-center text-sm text-white/60">
              New intern?{" "}
              <Link to="/register" className="text-blue-200 hover:text-white underline">
                Create account
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ADMIN MODAL */}
      {showAdminPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-[320px] rounded-xl bg-white p-6 text-center shadow-lg">
            <h2 className="text-lg font-semibold">Change Password?</h2>

            <p className="mt-2 text-sm text-gray-500">
              Do you want to update your admin password now?
            </p>

            <div className="mt-4 flex justify-center gap-2">
              <button
                className="rounded-xl bg-[#0B1F3B] px-3 py-2 text-white"
                onClick={() => navigate({ to: "/change-password" })}
              >
                Yes
              </button>

              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => {
                  localStorage.setItem("admin_prompt_seen", "true");
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

/* ===== COMPONENT ===== */

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
        "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
        (active ? "bg-white text-[#0B1F3B]" : "text-white/70 hover:text-white")
      }
    >
      {icon}
      {label}
    </button>
  );
}
