import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/intern")({
  component: InternLayout,
});

function InternLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", replace: true });
    else if (user.must_change_password) navigate({ to: "/change-password", replace: true });
    else if (user.role !== "intern") navigate({ to: "/admin", replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "intern" || user.must_change_password) return null;

  return (
    <AppShell variant="intern">
      <Outlet />
    </AppShell>
  );
}
