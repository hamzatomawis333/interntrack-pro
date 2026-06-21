import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/*
GET ALL DAILY REPORTS
*/
router.get("/", requireAuth(["admin"]), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        dr.id,
        dr.report_text,
        dr.report_date,
        dr.created_at,
        dr.is_seen,
        u.fullname
      FROM daily_reports dr
      JOIN users u ON u.id = dr.user_id
      ORDER BY dr.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
