import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

interface Row {
  id: number;
  fullname: string;
  username: string;
  required_hours: number;
  rendered_hours: number;
}

function ReportsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Row[]>("/admin/reports");
        setRows(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress reports"
        description="Required, rendered, remaining and percent complete per intern."
      />

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No interns yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Intern</th>
                  <th className="px-5 py-3 text-right font-medium">Required</th>
                  <th className="px-5 py-3 text-right font-medium">Rendered</th>
                  <th className="px-5 py-3 text-right font-medium">Remaining</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const remaining = Math.max(0, r.required_hours - r.rendered_hours);
                  const pct = Math.min(100, (r.rendered_hours / r.required_hours) * 100);
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium">{r.fullname}</div>
                        <div className="text-xs text-muted-foreground">@{r.username}</div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{r.required_hours}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold">
                        {r.rendered_hours.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{remaining.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.7_0.16_155)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-12 text-right text-xs font-semibold text-primary tabular-nums">
                            {pct.toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
