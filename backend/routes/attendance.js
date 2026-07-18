import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendNotification, attendanceEmail } from "../services/email.js";

const router = Router();

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayParts() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${mi}:${ss}`,
    day: DAY_NAMES[d.getDay()],
    weekday: d.getDay() >= 1 && d.getDay() <= 5,
  };
}

function timeToMin(t) {
  if (!t) return 0;
  const [h, m, s] = t.split(":").map(Number);
  return h * 60 + m + (s || 0) / 60;
}

function diffHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return 0;
  return Math.max(0, (timeToMin(timeOut) - timeToMin(timeIn)) / 60);
}

/* ================= TIME IN ================= */
router.post("/time-in", requireAuth(["intern"]), async (req, res) => {
  const t = todayParts();

  if (!t.weekday) {
    return res.status(400).json({ message: "Attendance is disabled on weekends" });
  }

  const [exists] = await pool.query(
    "SELECT id, time_in FROM attendance WHERE user_id = ? AND attendance_date = ?",
    [req.user.id, t.date],
  );

  if (exists.length && exists[0].time_in) {
    return res.status(400).json({ message: "Already timed in today" });
  }

  if (exists.length) {
    await pool.query(
      "UPDATE attendance SET time_in = ?, day_name = ?, status = 'incomplete' WHERE id = ?",
      [t.time, t.day, exists[0].id],
    );
  } else {
    await pool.query(
      `INSERT INTO attendance (user_id, attendance_date, day_name, time_in, status)
       VALUES (?, ?, ?, ?, 'incomplete')`,
      [req.user.id, t.date, t.day, t.time],
    );
  }

  res.json({ message: "Time in recorded", time: t.time });
});

/* ================= TIME OUT ================= */
router.post("/time-out", requireAuth(["intern"]), async (req, res) => {
  const t = todayParts();

  if (!t.weekday) {
    return res.status(400).json({ message: "Attendance is disabled on weekends" });
  }

  const [rows] = await pool.query(
    "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
    [req.user.id, t.date],
  );

  const row = rows[0];

  if (!row || !row.time_in) {
    return res.status(400).json({ message: "Time in is required first" });
  }

  if (row.time_out) {
    return res.status(400).json({ message: "Already timed out today" });
  }

  const hours = diffHours(row.time_in, t.time);

  await pool.query(
    "UPDATE attendance SET time_out = ?, total_hours = ?, status = 'present' WHERE id = ?",
    [t.time, hours.toFixed(2), row.id],
  );

  const [[user]] = await pool.query("SELECT fullname, email FROM users WHERE id = ?", [
    req.user.id,
  ]);
  const emailContent = attendanceEmail(
    user?.fullname || "Intern",
    "Time Out",
    hours.toFixed(2),
    t.date,
  );
  sendNotification(
    user?.email || null,
    emailContent.subject,
    emailContent.body,
    "attendance",
  ).catch(() => {});

  res.json({ message: "Time out recorded", time: t.time, total_hours: hours });
});

/* ================= SUMMARY ================= */
router.get("/summary", requireAuth(), async (req, res) => {
  try {
    const t = todayParts();
    const userId = req.user.id;

    const [[user]] = await pool.query("SELECT required_hours FROM users WHERE id = ?", [userId]);

    const [todayRows] = await pool.query(
      "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, t.date],
    );

    const today = todayRows[0] ?? null;

    const d = new Date();
    const dow = d.getDay() || 7;

    const monday = new Date(d);
    monday.setDate(d.getDate() - (dow - 1));

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fmt = (x) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
        x.getDate(),
      ).padStart(2, "0")}`;

    const [[weekAgg]] = await pool.query(
      `SELECT COALESCE(SUM(total_hours),0) AS h 
       FROM attendance 
       WHERE user_id = ? AND attendance_date BETWEEN ? AND ?`,
      [userId, fmt(monday), fmt(friday)],
    );

    const [[rendered]] = await pool.query(
      `SELECT 
        COALESCE((SELECT SUM(total_hours) FROM attendance WHERE user_id = ?), 0) +
        COALESCE((SELECT SUM(hours) FROM manual_attendance WHERE user_id = ?), 0) AS h`,
      [userId, userId],
    );

    const [recent] = await pool.query(
      `SELECT id, attendance_date, day_name, time_in, time_out, total_hours, status
       FROM attendance 
       WHERE user_id = ? 
       ORDER BY attendance_date DESC 
       LIMIT 10`,
      [userId],
    );

    res.json({
      today_hours: today?.total_hours ? Number(today.total_hours) : 0,
      weekly_hours: Number(weekAgg.h),
      rendered_hours: Number(rendered.h),
      required_hours: user?.required_hours || 0,
      today,
      recent,
    });
  } catch (err) {
    console.error("SUMMARY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= HISTORY ================= */
router.get("/history", requireAuth(["intern"]), async (req, res) => {
  const userId = req.user.id;

  const [auto] = await pool.query(
    `
    SELECT
      id,
      attendance_date,
      DAYNAME(attendance_date) AS day_name,
      time_in,
      time_out,
      total_hours,
      'auto' AS source
    FROM attendance
    WHERE user_id = ?
    `,
    [userId],
  );

  const [manual] = await pool.query(
    `
    SELECT
      id,
      date AS attendance_date,
      DAYNAME(date) AS day_name,
      time_in,
      time_out,
      hours AS total_hours,
      'manual' AS source
    FROM manual_attendance
    WHERE user_id = ?
    `,
    [userId],
  );

  const rows = [...auto, ...manual].sort((a, b) =>
    a.attendance_date < b.attendance_date ? 1 : -1,
  );

  const d = new Date();
  const dow = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fmt = (x) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

  const [weekAuto] = await pool.query(
    `SELECT DAYNAME(attendance_date) AS day, total_hours AS hours
     FROM attendance
     WHERE user_id = ? AND attendance_date BETWEEN ? AND ?`,
    [userId, fmt(monday), fmt(friday)],
  );

  const [weekManual] = await pool.query(
    `SELECT DAYNAME(date) AS day, hours
     FROM manual_attendance
     WHERE user_id = ? AND date BETWEEN ? AND ?`,
    [userId, fmt(monday), fmt(friday)],
  );

  const dayMap = new Map();
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  for (const r of [...weekAuto, ...weekManual]) {
    dayMap.set(r.day, (dayMap.get(r.day) || 0) + Number(r.hours));
  }
  const weekly = dayOrder.map((day) => ({ day, hours: dayMap.get(day) || 0 }));

  res.json({
    rows,
    weekly,
  });
});

/* ================= CALENDAR ================= */
router.get("/calendar", requireAuth(["intern"]), async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);

  if (!year || !month) {
    return res.status(400).json({ message: "year and month required" });
  }

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  const [auto] = await pool.query(
    `SELECT attendance_date AS date, COALESCE(total_hours,0) AS h
     FROM attendance 
     WHERE user_id = ? AND attendance_date BETWEEN ? AND ?`,
    [req.user.id, start, end],
  );

  const [manual] = await pool.query(
    `SELECT date, hours AS h 
     FROM manual_attendance 
     WHERE user_id = ? AND date BETWEEN ? AND ?`,
    [req.user.id, start, end],
  );

  const map = new Map();

  for (const r of [...auto, ...manual]) {
    map.set(r.date, (map.get(r.date) || 0) + Number(r.h));
  }

  const out = Array.from(map.entries()).map(([date, total_hours]) => ({
    date,
    total_hours,
  }));

  res.json(out);
});

/* ================= ADMIN ATTENDANCE (FIXED SAFE VERSION) ================= */
router.get("/admin/attendance", requireAuth(["admin"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        a.id,
        u.fullname,
        a.attendance_date,
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
        m.date AS attendance_date,
        DAYNAME(m.date) AS day_name,
        m.time_in,
        m.time_out,
        m.hours AS total_hours,
        'present' AS status,
        'manual' AS source
      FROM manual_attendance m
      JOIN users u ON u.id = m.user_id

      ORDER BY attendance_date DESC, id DESC
      `,
    );

    res.json(rows);
  } catch (err) {
    console.error("ADMIN ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Failed to load attendance records" });
  }
});

export default router;
