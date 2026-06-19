import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * CREATE DAILY REPORT
 */
router.post("/", requireAuth(), async (req, res) => {
  try {
    const { report_text } = req.body;
    const user_id = req.user.id;

    if (!user_id || !report_text) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await pool.query(
      `INSERT INTO daily_reports (user_id, report_text, report_date)
       VALUES (?, ?, CURDATE())`,
      [user_id, report_text],
    );

    res.json({ message: "Report saved successfully" });
  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
