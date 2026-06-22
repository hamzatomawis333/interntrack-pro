import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
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
  const navigate = useNavigate();

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
      await api(`/admin/interns/${id}`, {
        method: "DELETE",
      });

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

      <Card className="overflow-hidden p-0">
        {/* TABLE */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No intern accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <td>Intern</td>
                  <td>Username</td>
                  <td>Required Hours</td>
                  <td>Joined</td>
                  <td>Actions</td>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => goToAttendance(r.id)}
                    className="
                      cursor-pointer
                      border-b
                      hover:bg-slate-50
                      transition
                    "
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
                          setEdits((p) => ({
                            ...p,
                            [r.id]: Number(e.target.value),
                          }))
                        }
                        className="
                          h-9
                          w-28
                          rounded-md
                          border
                          border-input
                          bg-card
                          px-3
                          text-sm
                          outline-none
                          focus:border-primary
                        "
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
                          className="
                            inline-flex
                            items-center
                            rounded-md
                            bg-indigo-600
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-white
                            hover:bg-indigo-700
                            transition
                          "
                        >
                          Attendance
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateHours(r.id);
                          }}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-md
                            bg-cyan-600
                            px-3 py-2
                            text-xs
                            font-medium
                            text-white
                            hover:bg-cyan-700
                            transition
                          "
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(r.id);
                          }}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-md
                            border
                            border-red-200
                            bg-red-50
                            px-3 py-2
                            text-xs
                            font-medium
                            text-red-600
                            hover:bg-red-100
                            transition
                          "
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

export default UsersPage;
