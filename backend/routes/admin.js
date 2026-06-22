import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/* ================= STATS ================= */
router.get("/stats", requireAuth(["admin"]), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[a]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role='intern'");

    const [[b]] = await pool.query(
      `SELECT COUNT(*) AS n 
       FROM attendance 
       WHERE attendance_date = ? AND time_in IS NOT NULL`,
      [today],
    );

    const [[c]] = await pool.query(
      `SELECT 
        COALESCE(SUM(total_hours),0) 
        + COALESCE((SELECT SUM(hours) FROM manual_attendance),0) 
        AS h
       FROM attendance`,
    );

    const [recent] = await pool.query(
      `SELECT a.id, u.fullname, a.attendance_date, a.time_in, a.time_out, a.total_hours
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.attendance_date DESC, a.id DESC
       LIMIT 10`,
    );

    res.json({
      total_interns: Number(a.n),
      present_today: Number(b.n),
      absent_today: Math.max(0, Number(a.n) - Number(b.n)),
      total_rendered_hours: Number(c.h),
      recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Stats error" });
  }
});

/* ================= ATTENDANCE (FIXED + INCLUDES MANUAL) ================= */
router.get("/attendance", requireAuth(["admin"]), async (req, res) => {
  try {
    const { name, date, month } = req.query;

    const [rows] = await pool.query(
      `
      SELECT 
        a.id,
        u.fullname,
        a.attendance_date AS date,
        a.day_name,
        a.time_in,
        a.time_out,
        a.total_hours AS hours,
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
        m.hours AS hours,
        'present' AS status,
        'manual' AS source
      FROM manual_attendance m
      JOIN users u ON u.id = m.user_id
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
      filtered = filtered.filter((r) => r.date.slice(0, 7) === month);
    }

    filtered.sort((a, b) => (a.date < b.date ? 1 : -1));

    res.json(filtered.slice(0, 500));
  } catch (err) {
    console.error("ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Attendance error" });
  }
});

/* ================= REPORTS ================= */
router.get("/reports", requireAuth(["admin"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
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
       ORDER BY u.fullname ASC`,
    );

    res.json(
      rows.map((r) => ({
        ...r,
        rendered_hours: Number(r.rendered_hours),
        required_hours: Number(r.required_hours),
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reports error" });
  }
});

/* ================= INTERN LIST ================= */
router.get("/interns", requireAuth(["admin"]), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, fullname, username, required_hours, created_at
     FROM users WHERE role='intern'
     ORDER BY created_at DESC`,
  );

  res.json(rows);
});

/* ================= UPDATE INTERN ================= */
router.patch("/interns/:id", requireAuth(["admin"]), async (req, res) => {
  const { required_hours } = req.body;

  if (!required_hours || required_hours < 1) {
    return res.status(400).json({ message: "Invalid hours" });
  }

  await pool.query("UPDATE users SET required_hours=? WHERE id=? AND role='intern'", [
    required_hours,
    req.params.id,
  ]);

  res.json({ message: "Updated" });
});

/* ================= DELETE INTERN ================= */
router.delete("/interns/:id", requireAuth(["admin"]), async (req, res) => {
  await pool.query("DELETE FROM users WHERE id=? AND role='intern'", [req.params.id]);

  res.json({ message: "Deleted" });
});

/* ================= MANUAL ATTENDANCE INTERN ================= */
function diffHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return 0;

  const [ih, im] = timeIn.split(":").map(Number);
  const [oh, om] = timeOut.split(":").map(Number);

  return (oh * 60 + om - (ih * 60 + im)) / 60;
}

router.get("/interns/:userId/attendance", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.query(
      `
      SELECT
        id,
        attendance_date,
        day_name,
        time_in,
        time_out,
        total_hours,
        status
      FROM attendance
      WHERE user_id = ?
      ORDER BY attendance_date ASC
      `,
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error("ADMIN ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Failed to load attendance" });
  }
});

router.put("/interns/:userId/attendance", async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, time_in, time_out } = req.body;

    const hours = diffHours(time_in, time_out);

    const [existing] = await pool.query(
      `SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?`,
      [userId, date],
    );

    if (existing.length > 0) {
      await pool.query(
        `
        UPDATE attendance
        SET time_in = ?, time_out = ?, total_hours = ?
        WHERE user_id = ? AND attendance_date = ?
        `,
        [time_in, time_out, hours.toFixed(2), userId, date],
      );
    } else {
      await pool.query(
        `
        INSERT INTO attendance (user_id, attendance_date, time_in, time_out, total_hours, status)
        VALUES (?, ?, ?, ?, ?, 'present')
        `,
        [userId, date, time_in, time_out, hours.toFixed(2)],
      );
    }

    res.json({ message: "saved", hours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save attendance" });
  }
});
export default router;
