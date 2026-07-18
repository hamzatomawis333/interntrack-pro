import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }

    if (user.role === "admin") {
      navigate({ to: "/admin", replace: true });
    } else {
      navigate({ to: "/intern", replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-label="Loading"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
