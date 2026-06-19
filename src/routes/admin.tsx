import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", replace: true });
    else if (user.must_change_password) navigate({ to: "/change-password", replace: true });
    else if (user.role !== "admin") navigate({ to: "/intern", replace: true });
  }, [user, loading, navigate]);

  if (!user || user.role !== "admin" || user.must_change_password) return null;

  return (
    <AppShell variant="admin">
      <Outlet />
    </AppShell>
  );
}
