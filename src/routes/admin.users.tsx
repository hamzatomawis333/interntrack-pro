import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Input, PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";
import { Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

interface Intern {
  id: number;
  fullname: string;
  username: string;
  required_hours: number;
  created_at: string;
}

function UsersPage() {
  const [rows, setRows] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<number, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Intern[]>("/admin/interns");
      setRows(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateHours = async (id: number) => {
    const required = edits[id];
    if (!required || required < 1) return;
    try {
      await api(`/admin/interns/${id}`, {
        method: "PUT",
        body: { required_hours: required },
      });
      toast.success("Updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this intern and all their attendance? This cannot be undone.")) return;
    try {
      await api(`/admin/interns/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intern accounts"
        description="Manage intern profiles and required hours."
      />

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No intern accounts yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Intern</th>
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Required hours</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{r.fullname}</td>
                    <td className="px-5 py-3 text-muted-foreground">@{r.username}</td>
                    <td className="px-5 py-3">
                      <Input
                        type="number"
                        min={1}
                        defaultValue={r.required_hours}
                        className="h-9!-w-28"
                        onChange={(e) =>
                          setEdits((p) => ({ ...p, [r.id]: parseInt(e.target.value || "0", 10) }))
                        }
                      />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateHours(r.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Save className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={() => remove(r.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
