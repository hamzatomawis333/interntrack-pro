import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { toast } from "sonner";
import { Trash2, Save, Inbox, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const navigate = useNavigate();

  const [rows, setRows] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");

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

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.fullname.toLowerCase().includes(q) || r.username.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const goToAttendance = (id: number) => {
    navigate({
      to: "/admin/$userId",
      params: { userId: id.toString() },
    });
  };

  const updateHours = async (id: number) => {
    const required = edits[id];
    if (!required || required < 1) return;
    try {
      await api(`/admin/interns/${id}`, {
        method: "PUT",
        body: { required_hours: required },
      });
      toast.success("Updated successfully");
      await load();
    } catch {
      toast.error("Failed to update");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this intern? This will also remove all related records.")) return;
    try {
      await api(`/admin/interns/${id}`, { method: "DELETE" });
      toast.success("Deleted successfully");
      await load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Intern Accounts</h1>
        <p className="mt-2 text-muted-foreground">
          Manage intern profiles and required working hours.
        </p>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card px-4 pr-9 text-sm shadow-[var(--shadow-soft)] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {filteredRows.length} intern{filteredRows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <div className="text-sm">
              {rows.length === 0 ? "No intern accounts found" : "No interns match your search"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-6 py-4 text-left">Intern</th>
                  <th className="px-6 py-4 text-left">Username</th>
                  <th className="px-6 py-4 text-left">Required Hours</th>
                  <th className="px-6 py-4 text-left">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => goToAttendance(r.id)}
                    className="cursor-pointer border-b hover:bg-muted transition"
                  >
                    <td className="px-6 py-4 font-medium">{r.fullname}</td>
                    <td className="px-6 py-4 text-muted-foreground">@{r.username}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={1}
                        defaultValue={r.required_hours}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setEdits((p) => ({ ...p, [r.id]: Number(e.target.value) }))
                        }
                        className="h-9 w-28 rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToAttendance(r.id);
                          }}
                          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
                        >
                          Attendance
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateHours(r.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-700 transition"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(r.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
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
