import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/*
GET ALL DAILY REPORTS
*/
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        dr.id,
        dr.user_id,
        u.fullname,
        dr.report_text,
        dr.report_date,
        dr.created_at,
        dr.is_seen
      FROM daily_reports dr
      JOIN users u
        ON u.id = dr.user_id
      ORDER BY dr.report_date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load reports",
    });
  }
});

router.get("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(
      `
      SELECT id, report_text, report_date, created_at
      FROM daily_reports
      WHERE user_id = ?
      ORDER BY report_date DESC
      `,
      [userId],
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

export default router;
