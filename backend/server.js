import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendance.js";
import reportRoutes from "./routes/reports.js";
import adminDailyReportsRoutes from "./routes/adminDailyReports.js";

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:8081"],
    credentials: true,
  }),
);

app.use(express.json());

/* =========================
   HEALTH
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/daily-reports", adminDailyReportsRoutes);
app.use("/api/admin", adminRoutes);

/* =========================================================
   ADMIN STATS (FIXED - includes manual attendance)
========================================================= */
app.get("/api/admin/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[total]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role='intern'");

    const [[present]] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) AS count
       FROM attendance
       WHERE attendance_date = ? AND time_in IS NOT NULL`,
      [today],
    );

    const [[hours]] = await pool.query(
      `SELECT
        COALESCE((SELECT SUM(total_hours) FROM attendance),0)
        +
        COALESCE((SELECT SUM(hours) FROM manual_attendance),0)
       AS total`,
    );

    const [[absent]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE role='intern'
       AND id NOT IN (
         SELECT DISTINCT user_id
         FROM attendance
         WHERE attendance_date = ?
       )`,
      [today],
    );

    const [recent] = await pool.query(`
      SELECT a.id, u.fullname, a.attendance_date, a.time_in, a.time_out, a.total_hours
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      ORDER BY a.attendance_date DESC, a.id DESC
      LIMIT 10
    `);

    res.json({
      total_interns: total.count,
      present_today: present.count,
      absent_today: absent.count,
      total_rendered_hours: Number(hours.total),
      recent,
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   ADMIN ATTENDANCE (🔥 FIXED - includes manual attendance)
========================================================= */
app.get("/api/admin/attendance", async (req, res) => {
  try {
    const { name = "", date = "", month = "" } = req.query;

    const [rows] = await pool.query(
      `
      SELECT
        a.id,
        u.fullname,
        a.attendance_date AS date,
        a.day_name,
        a.time_in,
        a.time_out,
        a.total_hours,
        a.status,
        'auto' AS source
      FROM attendance a
      JOIN users u ON u.id = a.user_id

      UNION ALL

      SELECT
        m.id,
        u.fullname,
        m.date AS date,
        DAYNAME(m.date) AS day_name,
        m.time_in,
        m.time_out,
        m.hours AS total_hours,
        'present' AS status,
        'manual' AS source
      FROM manual_attendance m
      JOIN users u ON u.id = m.user_id

      ORDER BY date DESC
      `,
    );

    let filtered = rows;

    if (name) {
      filtered = filtered.filter((r) => r.fullname.toLowerCase().includes(name.toLowerCase()));
    }

    if (date) {
      filtered = filtered.filter((r) => r.date === date);
    }

    if (month) {
      filtered = filtered.filter((r) => r.date.startsWith(month));
    }

    res.json(filtered);
  } catch (err) {
    console.error("ADMIN ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   ADMIN REPORTS (FIXED - includes manual attendance)
========================================================= */
app.get("/api/admin/reports", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.fullname,
        u.username,
        u.required_hours,
        COALESCE((SELECT SUM(total_hours) FROM attendance WHERE user_id = u.id),0)
        +
        COALESCE((SELECT SUM(hours) FROM manual_attendance WHERE user_id = u.id),0)
        AS rendered_hours
      FROM users u
      WHERE u.role='intern'
    `);

    res.json(
      rows.map((r) => ({
        ...r,
        rendered_hours: Number(r.rendered_hours),
      })),
    );
  } catch (err) {
    console.error("ADMIN REPORTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   ADMIN INTERNS
========================================================= */
app.get("/api/admin/interns", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, fullname, username, required_hours, created_at
      FROM users
      WHERE role='intern'
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("INTERN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   UPDATE INTERN
========================================================= */
app.put("/api/admin/interns/:id", async (req, res) => {
  try {
    const { required_hours } = req.body;

    await pool.query("UPDATE users SET required_hours=? WHERE id=? AND role='intern'", [
      required_hours,
      req.params.id,
    ]);

    res.json({ message: "Updated" });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   DELETE INTERN
========================================================= */
app.delete("/api/admin/interns/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // optional safety check
    await pool.query("DELETE FROM attendance WHERE user_id = ?", [id]);

    await pool.query("DELETE FROM manual_attendance WHERE user_id = ?", [id]);

    await pool.query("DELETE FROM users WHERE id = ? AND role='intern'", [id]);

    res.json({ message: "Intern deleted successfully" });
  } catch (err) {
    console.error("DELETE INTERN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   MARK DAILY REPORT AS SEEN
========================================================= */
app.patch("/api/admin/daily-reports/:id/seen", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("UPDATE daily_reports SET is_seen = 1 WHERE id = ?", [id]);

    res.json({ message: "Marked as seen" });
  } catch (err) {
    console.error("MARK SEEN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   UNREAD DAILY REPORTS COUNT
========================================================= */
app.get("/api/admin/daily-reports/unread-count", async (req, res) => {
  try {
    const [[result]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM daily_reports
      WHERE is_seen = 0
    `);

    res.json({ count: result.count });
  } catch (err) {
    console.error("UNREAD COUNT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/daily-reports/unread-count", async (req, res) => {
  try {
    const [[result]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM daily_reports
      WHERE is_seen = 0
    `);

    res.json({ count: result.count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   START SERVER
========================================================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
