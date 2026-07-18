import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";
import { Card, PageHeader, PasswordInput } from "@/components/ui-kit";
import { toast } from "sonner";
import { User, Lock, Sun, Moon, Monitor, Palette, Info, Check } from "lucide-react";
import { ProfilePicture } from "@/components/ProfilePicture";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { dark, toggleDark, accentIndex, setAccent, accentPresets } = useTheme();

  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [ppKey, setPpKey] = useState(0);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = fullname.trim();
    if (!trimmed) {
      toast.error("Full name cannot be empty");
      return;
    }

    if (trimmed === user?.fullname) {
      toast.info("No changes to save");
      return;
    }

    setSavingName(true);
    try {
      const res = await api<{ message: string; user: typeof user }>("/auth/profile", {
        method: "PUT",
        body: { fullname: trimmed },
      });

      if (res.user) {
        setUser(res.user);
      }

      toast.success("Name updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setSavingPassword(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account settings and preferences." />

      {/* PROFILE PICTURE + INFO */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">Your account information and photo</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <ProfilePicture
              userId={user?.id ?? 0}
              size="xl"
              editable
              onUpdate={() => setPpKey((k) => k + 1)}
            />
            <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5MB.</p>
          </div>

          <form onSubmit={handleUpdateName} className="flex-1 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Username</label>
              <input
                value={user?.username ?? ""}
                disabled
                className="h-11 w-full rounded-xl border border-input bg-muted px-3.5 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-muted-foreground">Username cannot be changed</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Full name</label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm shadow-(--shadow-soft) outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={savingName || fullname.trim() === user?.fullname}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-(--shadow-elevated) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingName ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </Card>

      {/* APPEARANCE */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize the look and feel</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Theme mode */}
          <div>
            <label className="mb-2 block text-sm font-medium">Theme</label>
            <div className="flex gap-2">
              {[
                { label: "Light", icon: Sun, active: !dark },
                { label: "Dark", icon: Moon, active: dark },
              ].map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  onClick={() => {
                    if ((label === "Dark" && !dark) || (label === "Light" && dark)) toggleDark();
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="mb-2 block text-sm font-medium">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {accentPresets.map((preset, i) => {
                const colors = ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#ef4444", "#14b8a6"];
                return (
                  <button
                    key={preset.label}
                    onClick={() => setAccent(i)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      accentIndex === i
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: colors[i] }} />
                    {preset.label}
                    {accentIndex === i && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* PASSWORD */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Change Password</h2>
            <p className="text-sm text-muted-foreground">
              Keep your account secure with a strong password
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <PasswordInput
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
          />

          <PasswordInput
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-(--shadow-elevated) disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPassword ? "Updating..." : "Change password"}
          </button>
        </form>
      </Card>

      {/* SYSTEM INFO */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">System Information</h2>
            <p className="text-sm text-muted-foreground">About this application</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 max-w-lg">
          {[
            { label: "Application", value: "OJT Tracker" },
            { label: "Version", value: "1.0.0" },
            {
              label: "Role",
              value: user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || ""),
            },
            {
              label: "Required Hours",
              value: user?.required_hours ? `${user.required_hours}h` : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between rounded-xl bg-muted/50 px-4 py-2.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
