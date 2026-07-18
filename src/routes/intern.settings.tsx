import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/components/SettingsPage";

export const Route = createFileRoute("/intern/settings")({
  component: InternSettings,
});

function InternSettings() {
  return <SettingsPage />;
}
