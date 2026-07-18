import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui-kit";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
    const load = async (): Promise<void> => {
      try {
        const data = await api<Row[]>("/admin/reports");

        setRows(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <div
          className="
text-sm

font-semibold

text-cyan-700
"
        >
          Analytics
        </div>

        <h1
          className="
mt-2

text-4xl

font-bold
"
        >
          Progress Reports
        </h1>

        <p
          className="
mt-3

text-muted-foreground
"
        >
          Track rendered, remaining, and completion progress.
        </p>
      </div>

      {/* TABLE */}

      <Card
        className="
overflow-hidden
p-0
"
      >
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div
            className="
p-12

text-center

text-muted-foreground
"
          >
            No interns yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="
w-full
"
            >
              <thead>
                <tr
                  className="
border-b

bg-slate-50

text-xs

uppercase

tracking-[0.12em]

text-slate-500
"
                >
                  <th className="px-6 py-5 text-left">Intern</th>

                  <th className="px-6 py-5 text-right">Required</th>

                  <th className="px-6 py-5 text-right">Rendered</th>

                  <th className="px-6 py-5 text-right">Remaining</th>

                  <th className="px-6 py-5">Progress</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const rendered = Number(row.rendered_hours ?? 0);

                  const remaining = Math.max(0, row.required_hours - rendered);

                  const pct = Math.min(100, (rendered / row.required_hours) * 100);

                  return (
                    <tr
                      key={row.id}
                      className="
border-b

hover:bg-slate-50

transition
"
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold">{row.fullname}</div>

                        <div
                          className="
mt-1

text-xs

text-muted-foreground
"
                        >
                          @{row.username}
                        </div>
                      </td>

                      <td
                        className="
px-6
py-5

text-right

tabular-nums
"
                      >
                        {row.required_hours}h
                      </td>

                      <td
                        className="
px-6
py-5

text-right

font-semibold

text-cyan-700

tabular-nums
"
                      >
                        {rendered.toFixed(2)}h
                      </td>

                      <td
                        className="
px-6
py-5

text-right

tabular-nums
"
                      >
                        {remaining.toFixed(2)}h
                      </td>

                      <td className="px-6 py-5">
                        <div
                          className="
flex

items-center

gap-4
"
                        >
                          <div
                            className="
h-[7px]

flex-1

overflow-hidden

rounded-full

bg-slate-200
"
                            role="progressbar"
                            aria-valuenow={Math.round(pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${row.fullname} progress: ${pct.toFixed(0)}%`}
                          >
                            <div
                              className="
h-full

rounded-full

bg-gradient-to-r

from-cyan-500

to-indigo-500
"
                              style={{
                                width: `${pct}%`,
                              }}
                            />
                          </div>

                          <div
                            className="
w-14

text-right

text-sm

font-semibold

text-cyan-700
"
                          >
                            {pct.toFixed(0)}%
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
