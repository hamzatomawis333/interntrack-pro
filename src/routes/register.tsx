import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Input, PasswordInput } from "@/components/ui-kit";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
        body: {
          fullname,
          username,
          password,
        },
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
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/ictologo3.png')" }}
    >
      {/* DARK CINEMATIC OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

      {/* FLOATING GLOW EFFECTS */}
      <div className="absolute -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate({ to: "/auth" })}
        className="
          absolute top-6 left-6
          flex items-center gap-2
          text-white/70 hover:text-white
          transition
          bg-white/10 border border-white/15
          px-4 py-2 rounded-xl
          backdrop-blur-md
        "
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* CARD WRAPPER */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="
            rounded-3xl
            border border-white/15
            bg-white/10
            backdrop-blur-2xl
            p-8
            shadow-[0_40px_120px_rgba(0,0,0,0.7)]
            text-white
          "
        >
          {/* TITLE */}
          <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>

          <p className="mt-1 text-sm text-white/60">Join the ICTO internship monitoring system</p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Full name"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Juan Dela Cruz"
              labelClassName="text-white/90"
              className="text-black"
            />

            <Input
              label="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="juandc"
              labelClassName="text-white/90"
              className="text-black"
            />

            <div className="grid grid-cols-2 gap-3">
              <PasswordInput
                label="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                labelClassName="text-white/90"
                className="text-black"
              />

              <PasswordInput
                label="Confirm"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat"
                labelClassName="text-white/90"
                className="text-black"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="
                w-full h-12 rounded-2xl
                bg-gradient-to-r from-[#0B1F3B] to-[#1E3A8A]
                text-white font-medium
                transition-all
                hover:scale-[1.02] hover:shadow-2xl
              "
            >
              {submitting ? "Creating..." : "Create account"}
            </Button>
          </form>

          {/* FOOTER */}
          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/auth" className="text-blue-200 hover:text-white underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
