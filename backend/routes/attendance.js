import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

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

// POST /api/attendance/time-in
router.post("/time-in", requireAuth(["intern"]), async (req, res) => {
  const t = todayParts();
  if (!t.weekday) return res.status(400).json({ message: "Attendance is disabled on weekends" });

  const [exists] = await pool.query(
    "SELECT id, time_in FROM attendance WHERE user_id = ? AND attendance_date = ?",
    [req.user.id, t.date]
  );
  if (exists.length && exists[0].time_in)
    return res.status(400).json({ message: "Already timed in today" });

  if (exists.length) {
    await pool.query(
      "UPDATE attendance SET time_in = ?, day_name = ?, status = 'incomplete' WHERE id = ?",
      [t.time, t.day, exists[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO attendance (user_id, attendance_date, day_name, time_in, status)
       VALUES (?, ?, ?, ?, 'incomplete')`,
      [req.user.id, t.date, t.day, t.time]
    );
  }
  res.json({ message: "Time in recorded", time: t.time });
});

// POST /api/attendance/time-out
router.post("/time-out", requireAuth(["intern"]), async (req, res) => {
  const t = todayParts();
  if (!t.weekday) return res.status(400).json({ message: "Attendance is disabled on weekends" });

  const [rows] = await pool.query(
    "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
    [req.user.id, t.date]
  );
  const row = rows[0];
  if (!row || !row.time_in) return res.status(400).json({ message: "Time in is required first" });
  if (row.time_out) return res.status(400).json({ message: "Already timed out today" });

  const hours = diffHours(row.time_in, t.time);
  await pool.query(
    "UPDATE attendance SET time_out = ?, total_hours = ?, status = 'present' WHERE id = ?",
    [t.time, hours.toFixed(2), row.id]
  );
  res.json({ message: "Time out recorded", time: t.time, total_hours: hours });
});

async function sumHours(userId) {
  const [auto] = await pool.query(
    "SELECT COALESCE(SUM(total_hours),0) AS h FROM attendance WHERE user_id = ?",
    [userId]
  );
  const [man] = await pool.query(
    "SELECT COALESCE(SUM(hours),0) AS h FROM manual_attendance WHERE user_id = ?",
    [userId]
  );
  return Number(auto[0].h) + Number(man[0].h);
}

// GET /api/attendance/summary  (intern)
router.get("/summary", requireAuth(["intern"]), async (req, res) => {
  const t = todayParts();
  const userId = req.user.id;
  const [[user]] = await pool.query("SELECT required_hours FROM users WHERE id = ?", [userId]);

  // today
  const [todayRows] = await pool.query(
    "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
    [userId, t.date]
  );
  const today = todayRows[0] ?? null;

  // weekly (Mon..Fri of current week)
  const d = new Date();
  const dow = d.getDay() || 7; // Sun = 7
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (x) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

  const [[weekAgg]] = await pool.query(
    `SELECT COALESCE(SUM(total_hours),0) AS h FROM attendance
     WHERE user_id = ? AND attendance_date BETWEEN ? AND ?`,
    [userId, fmt(monday), fmt(friday)]
  );

  const rendered = await sumHours(userId);

  const [recent] = await pool.query(
    `SELECT id, attendance_date, day_name, time_in, time_out, total_hours, status
     FROM attendance WHERE user_id = ?
     ORDER BY attendance_date DESC LIMIT 10`,
    [userId]
  );

  res.json({
    today_hours: today?.total_hours ? Number(today.total_hours) : 0,
    weekly_hours: Number(weekAgg.h),
    rendered_hours: rendered,
    required_hours: user.required_hours,
    today,
    recent,
  });
});

// GET /api/attendance/history  (intern)
router.get("/history", requireAuth(["intern"]), async (req, res) => {
  const userId = req.user.id;
  const [auto] = await pool.query(
    `SELECT id, attendance_date, day_name, time_in, time_out, total_hours,
            'auto' AS source
     FROM attendance WHERE user_id = ?`,
    [userId]
  );
  const [manual] = await pool.query(
    `SELECT id, date AS attendance_date,
            DAYNAME(date) AS day_name,
            time_in, time_out, hours AS total_hours,
            'manual' AS source
     FROM manual_attendance WHERE user_id = ?`,
    [userId]
  );
  const rows = [...auto, ...manual].sort((a, b) =>
    a.attendance_date < b.attendance_date ? 1 : -1
  );

  // weekly Mon..Fri current
  const d = new Date();
  const dow = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow - 1));
  const weekly = [];
  for (let i = 0; i < 5; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    const ds = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    const match = rows.find((r) => r.attendance_date === ds);
    weekly.push({
      day: DAY_NAMES[x.getDay()],
      hours: match ? Number(match.total_hours || 0) : 0,
    });
  }
  res.json({ rows, weekly });
});

// POST /api/attendance/manual
router.post("/manual", requireAuth(["intern"]), async (req, res) => {
  const { date, time_in, time_out } = req.body || {};
  if (!date || !time_in || !time_out)
    return res.status(400).json({ message: "Date, time in, and time out are required" });
  const d = new Date(date);
  if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid date" });
  const hours = diffHours(
    time_in.length === 5 ? `${time_in}:00` : time_in,
    time_out.length === 5 ? `${time_out}:00` : time_out
  );
  if (hours <= 0) return res.status(400).json({ message: "Time out must be after time in" });

  await pool.query(
    `INSERT INTO manual_attendance (user_id, date, time_in, time_out, hours)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, date, time_in, time_out, hours.toFixed(2)]
  );
  res.status(201).json({ message: "Manual entry added", hours });
});

// GET /api/attendance/calendar?year=YYYY&month=MM
router.get("/calendar", requireAuth(["intern"]), async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month) return res.status(400).json({ message: "year and month required" });
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  const [auto] = await pool.query(
    `SELECT attendance_date AS date, COALESCE(total_hours,0) AS h
     FROM attendance WHERE user_id = ? AND attendance_date BETWEEN ? AND ?`,
    [req.user.id, start, end]
  );
  const [manual] = await pool.query(
    `SELECT date, hours AS h FROM manual_attendance WHERE user_id = ? AND date BETWEEN ? AND ?`,
    [req.user.id, start, end]
  );
  const map = new Map();
  for (const r of [...auto, ...manual]) {
    map.set(r.date, (map.get(r.date) || 0) + Number(r.h));
  }
  const out = Array.from(map.entries()).map(([date, total_hours]) => ({ date, total_hours }));
  res.json(out);
});

export default router;
