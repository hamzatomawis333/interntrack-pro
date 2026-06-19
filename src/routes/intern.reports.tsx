import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/intern/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReport = async () => {
    if (!text.trim()) {
      toast.error("Please write a report");
      return;
    }

    setLoading(true);

    try {
      await api("/reports", {
        method: "POST",
        body: {
          report_text: text, // ✅ FIXED: match backend
        },
      });

      toast.success("Report submitted!");
      setText("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit report";

      console.log("SUBMIT ERROR:", message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Daily Report</h1>

      <textarea
        className="w-full border p-3 rounded"
        rows={6}
        placeholder="Write what you did today..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={submitReport}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Report"}
      </button>
    </div>
  );
}
