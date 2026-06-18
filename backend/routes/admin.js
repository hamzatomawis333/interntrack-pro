import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/admin/stats
router.get("/stats", requireAuth(["admin"]), async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [[a]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role='intern'");
  const [[b]] = await pool.query(
    "SELECT COUNT(*) AS n FROM attendance WHERE attendance_date = ? AND time_in IS NOT NULL",
    [today]
  );
  const [[c]] = await pool.query(
    `SELECT COALESCE(SUM(total_hours),0) + COALESCE((SELECT SUM(hours) FROM manual_attendance),0) AS h
     FROM attendance`
  );
  const total_interns = Number(a.n);
  const present_today = Number(b.n);
  const absent_today = Math.max(0, total_interns - present_today);

  const [recent] = await pool.query(
    `SELECT a.id, u.fullname, a.attendance_date, a.time_in, a.time_out, a.total_hours
     FROM attendance a JOIN users u ON u.id = a.user_id
     ORDER BY a.attendance_date DESC, a.id DESC LIMIT 10`
  );

  res.json({
    total_interns,
    present_today,
    absent_today,
    total_rendered_hours: Number(c.h),
    recent,
  });
});

// GET /api/admin/attendance?name=&date=&month=
router.get("/attendance", requireAuth(["admin"]), async (req, res) => {
  const { name, date, month } = req.query;
  const where = [];
  const params = [];
  if (name) {
    where.push("u.fullname LIKE ?");
    params.push(`%${name}%`);
  }
  if (date) {
    where.push("a.attendance_date = ?");
    params.push(date);
  }
  if (month) {
    // "YYYY-MM"
    where.push("DATE_FORMAT(a.attendance_date,'%Y-%m') = ?");
    params.push(month);
  }
  const sql =
    `SELECT a.id, u.fullname, a.attendance_date, a.day_name, a.time_in, a.time_out,
            a.total_hours, a.status
     FROM attendance a JOIN users u ON u.id = a.user_id` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY a.attendance_date DESC, u.fullname ASC LIMIT 500";
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// GET /api/admin/reports
router.get("/reports", requireAuth(["admin"]), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.fullname, u.username, u.required_hours,
            COALESCE((SELECT SUM(total_hours) FROM attendance WHERE user_id = u.id),0)
            + COALESCE((SELECT SUM(hours) FROM manual_attendance WHERE user_id = u.id),0)
            AS rendered_hours
     FROM users u
     WHERE u.role = 'intern'
     ORDER BY u.fullname ASC`
  );
  res.json(
    rows.map((r) => ({
      ...r,
      rendered_hours: Number(r.rendered_hours),
      required_hours: Number(r.required_hours),
    }))
  );
});

// GET /api/admin/interns
router.get("/interns", requireAuth(["admin"]), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, fullname, username, required_hours, created_at
     FROM users WHERE role = 'intern' ORDER BY created_at DESC`
  );
  res.json(rows);
});

// PATCH /api/admin/interns/:id
router.patch("/interns/:id", requireAuth(["admin"]), async (req, res) => {
  const { required_hours } = req.body || {};
  if (!required_hours || required_hours < 1)
    return res.status(400).json({ message: "Invalid required_hours" });
  await pool.query(
    "UPDATE users SET required_hours = ? WHERE id = ? AND role = 'intern'",
    [required_hours, req.params.id]
  );
  res.json({ message: "Updated" });
});

// DELETE /api/admin/interns/:id
router.delete("/interns/:id", requireAuth(["admin"]), async (req, res) => {
  await pool.query("DELETE FROM users WHERE id = ? AND role = 'intern'", [req.params.id]);
  res.json({ message: "Deleted" });
});

export default router;
