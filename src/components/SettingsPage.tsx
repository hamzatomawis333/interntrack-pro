import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, PageHeader, PasswordInput } from "@/components/ui-kit";
import { toast } from "sonner";
import { User, Lock } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useAuth();

  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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
      <PageHeader
        title="Settings"
        description="Manage your account settings and personal information."
      />

      {/* PROFILE SECTION */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <p className="text-sm text-muted-foreground">Update your display name</p>
          </div>
        </div>

        <form onSubmit={handleUpdateName} className="space-y-4 max-w-lg">
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
      </Card>

      {/* PASSWORD SECTION */}
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
    </div>
  );
}
