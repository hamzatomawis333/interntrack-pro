import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendNotification, reportEmail } from "../services/email.js";

const router = express.Router();

/**
 * CREATE DAILY REPORT
 */
router.post("/", requireAuth(), async (req, res) => {
  try {
    const { report_text, report_date } = req.body;

    const user_id = req.user.id;

    if (!user_id || !report_text || !report_date) {
      return res.status(400).json({
        message: "Missing fields",
      });
    }

    await pool.query(
      `
      INSERT INTO daily_reports
      (
        user_id,
        report_text,
        report_date
      )
      VALUES
      (
        ?,
        ?,
        ?
      )
      `,
      [user_id, report_text, report_date],
    );

    const [[user]] = await pool.query("SELECT fullname FROM users WHERE id = ?", [user_id]);
    const email = reportEmail(user?.fullname || "Intern", report_text);
    sendNotification(null, email.subject, email.body, "report").catch(() => {});

    res.json({
      message: "Report saved successfully",
    });
  } catch (err) {
    console.error("REPORT ERROR:", err);

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

router.get("/my", requireAuth(["intern"]), async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT
        id,
        report_text,
        report_date,
        created_at
      FROM daily_reports
      WHERE user_id = ?
      ORDER BY report_date DESC, created_at DESC
      `,
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error("REPORTS MY ERROR:", err);
    res.status(500).json({ message: "Failed to load reports" });
  }
});

export default router;
