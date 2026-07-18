import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/components/SettingsPage";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return <SettingsPage />;
}
