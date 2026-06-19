import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui-kit";
import { Clock3 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [requiredHours, setRequiredHours] = useState(486);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/register", {
        method: "POST",
        auth: false,
        body: { fullname, username, password, required_hours: requiredHours },
      });
      toast.success("Account created. Please sign in.");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clock3 className="h-5 w-5" />
          </div>
          <span className="font-semibold">OJT Tracker</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card) sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Create your intern account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your details to start logging attendance.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Full name"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Juan Dela Cruz"
            />
            <Input
              label="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="juandc"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
              <Input
                label="Confirm password"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            <Input
              label="Required hours"
              type="number"
              min={1}
              max={2000}
              value={requiredHours}
              onChange={(e) => setRequiredHours(parseInt(e.target.value || "0", 10))}
            />
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Creating…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
