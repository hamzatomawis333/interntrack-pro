import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/daily-reports")({
  component: DailyReportsPage,
});

interface Report {
  id: number;
  user_id: number;
  fullname: string;
  report_text: string;
  report_date: string;
  created_at: string;
  is_seen: number;
}

interface UserReport {
  id: number;
  report_text: string;
  report_date: string;
  created_at: string;
}

function DailyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  async function loadReports() {
    try {
      setLoading(true);

      const data = await api<Report[]>("/admin/daily-reports");

      setReports(data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const interns = useMemo(() => {
    const unique = new Map();

    reports.forEach((r) => {
      if (r.user_id !== undefined && !unique.has(r.user_id)) {
        unique.set(r.user_id, {
          user_id: r.user_id,
          fullname: r.fullname,
        });
      }
    });

    return Array.from(unique.values());
  }, [reports]);

  async function openIntern(userId: number, fullname: string) {
    console.log("CLICK:", userId);

    if (!userId) {
      toast.error("Invalid User");
      return;
    }

    try {
      setSelectedUserId(userId);
      setUserName(fullname);

      setLoadingReports(true);

      setUserReports([]);

      const data = await api<UserReport[]>(`/admin/daily-reports/user/${userId}`);

      console.log("RESULT:", data);

      setUserReports(data);
    } catch (err) {
      console.log(err);

      toast.error(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Reports</h1>

        <p className="text-muted-foreground">Select an intern to view reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Intern List</h2>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-2">
              {interns.map((i: { user_id: number; fullname: string }) => (
                <button
                  key={i.user_id}
                  onClick={() => openIntern(i.user_id, i.fullname)}
                  className={`
                  w-full
                  rounded-xl
                  border
                  p-4
                  text-left
                  transition

                  ${selectedUserId === i.user_id ? "border-blue-500 bg-blue-50" : "hover:bg-muted"}
                  `}
                >
                  <div className="font-semibold">{i.fullname}</div>

                  <div className="text-xs text-muted-foreground">
                    User ID:
                    {i.user_id}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          {!selectedUserId ? (
            <div className="text-muted-foreground">Select an intern</div>
          ) : loadingReports ? (
            <div>Loading reports...</div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{userName}</h2>

                  <p className="text-sm text-muted-foreground">Daily activity reports</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedUserId(null);
                    setUserName("");
                    setUserReports([]);
                  }}
                  className="
      rounded-lg
      border
      px-4
      py-2
      text-sm
      hover:bg-muted
      transition
    "
                >
                  ← Back
                </button>
              </div>
              {userReports.length === 0 ? (
                <div>No reports</div>
              ) : (
                <div className="space-y-3">
                  {userReports.map((r) => (
                    <div
                      key={r.id}
                      className="
                      rounded-xl
                      border
                      p-4
                      "
                    >
                      <div>{r.report_text}</div>

                      <div
                        className="
                        mt-2
                        text-xs
                        text-muted-foreground
                        "
                      >
                        {r.report_date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
