import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, PasswordInput } from "@/components/ui-kit";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (next !== confirm) return toast.error("Passwords do not match.");
    if (next === "admin") return toast.error("New password cannot be the default password.");
    setSubmitting(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { current_password: current, new_password: next },
      });
      if (user) setUser({ ...user, must_change_password: false });
      toast.success("Password updated");
      navigate({ to: user?.role === "admin" ? "/admin" : "/intern", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card) sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For security, you must change the default password before accessing the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <PasswordInput
              label="Current password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <PasswordInput
              label="New password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Min. 8 characters"
            />
            <PasswordInput
              label="Confirm new password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
