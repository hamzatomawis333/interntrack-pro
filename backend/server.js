import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendance.js";
import reportRoutes from "./routes/reports.js";

import { pool } from "./db.js";

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE (IMPORTANT)
========================= */
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:8081"],
    credentials: true,
  }),
);

app.use(express.json()); // 🔥 MUST be BEFORE routes

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes); // ✅ FIXED POSITION

/* =========================
   REPORTS
========================= */
app.post("/api/reports", async (req, res) => {
  try {
    const userId = req.user?.id || 1; // (temporary if walang auth yet)
    const { report_text } = req.body;

    if (!report_text) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // get today's attendance
    const [attendance] = await pool.query(
      `SELECT id FROM attendance 
       WHERE user_id = ? AND attendance_date = CURDATE()
       LIMIT 1`,
      [userId],
    );

    if (attendance.length === 0) {
      return res.status(400).json({
        message: "No attendance found for today",
      });
    }

    const attendance_id = attendance[0].id;

    await pool.query(
      `INSERT INTO daily_reports (attendance_id, report_text)
       VALUES (?, ?)`,
      [attendance_id, report_text],
    );

    res.json({ message: "Report saved successfully" });
  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* =========================
   ADMIN STATS
========================= */
app.get("/api/admin/stats", async (req, res) => {
  try {
    const [total] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role='intern'");

    const [present] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM attendance 
       WHERE attendance_date = CURDATE() 
       AND time_in IS NOT NULL`,
    );

    const [absent] = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE role='intern' 
       AND id NOT IN (
         SELECT DISTINCT user_id 
         FROM attendance 
         WHERE attendance_date = CURDATE()
       )`,
    );

    const [hours] = await pool.query(
      "SELECT COALESCE(SUM(total_hours),0) as total FROM attendance",
    );

    const [recent] = await pool.query(`
      SELECT a.id, u.fullname, a.attendance_date, a.time_in, a.time_out, a.total_hours
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      ORDER BY a.attendance_date DESC
      LIMIT 10
    `);

    res.json({
      total_interns: total[0].count,
      present_today: present[0].count,
      absent_today: absent[0].count,
      total_rendered_hours: hours[0].total,
      recent,
    });
  } catch (err) {
    console.error("🔥 ADMIN STATS ERROR:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

/* =========================
   ADMIN ATTENDANCE
========================= */
app.get("/api/admin/attendance", async (req, res) => {
  try {
    const { name = "", date = "", month = "" } = req.query;

    let query = `
      SELECT 
        a.id,
        u.fullname,
        a.attendance_date,
        a.day_name,
        a.time_in,
        a.time_out,
        a.total_hours,
        a.status
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE 1=1
    `;

    const params = [];

    if (name) {
      query += " AND u.fullname LIKE ?";
      params.push(`%${name}%`);
    }

    if (date) {
      query += " AND a.attendance_date = ?";
      params.push(date);
    }

    if (month) {
      query += " AND DATE_FORMAT(a.attendance_date, '%Y-%m') = ?";
      params.push(month);
    }

    query += " ORDER BY a.attendance_date DESC";

    const [rows] = await pool.query(query, params);

    res.json(rows);
  } catch (err) {
    console.error("ADMIN ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN REPORTS
========================= */
app.get("/api/admin/reports", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.fullname,
        u.required_hours,
        COALESCE(SUM(a.total_hours), 0) AS rendered_hours
      FROM users u
      LEFT JOIN attendance a ON a.user_id = u.id
      WHERE u.role = 'intern'
      GROUP BY u.id
    `);

    const formatted = rows.map((r) => ({
      ...r,
      remaining_hours: Math.max(0, r.required_hours - r.rendered_hours),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("ADMIN REPORTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN INTERNS
========================= */
app.get("/api/admin/interns", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, fullname, username, required_hours, created_at
      FROM users
      WHERE role = 'intern'
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("INTERN LIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   UPDATE INTERN
========================= */
app.put("/api/admin/interns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { required_hours } = req.body;

    await pool.query("UPDATE users SET required_hours = ? WHERE id = ? AND role = 'intern'", [
      required_hours,
      id,
    ]);

    res.json({ message: "Intern updated successfully" });
  } catch (err) {
    console.error("UPDATE INTERN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
