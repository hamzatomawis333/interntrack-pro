import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

function publicUser(u) {
  return {
    id: u.id,
    fullname: u.fullname,
    username: u.username,
    role: u.role,
    required_hours: u.required_hours,
    must_change_password: !!u.must_change_password,
  };
}

// POST /api/auth/login  { username, password, role }
router.post("/login", async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role)
    return res.status(400).json({ message: "Missing credentials" });

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ? AND role = ? LIMIT 1",
    [username, role]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ message: "Invalid username or password" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid username or password" });

  const token = signToken({ id: user.id, role: user.role, username: user.username });
  res.json({ token, user: publicUser(user) });
});

// POST /api/auth/register  (intern self-registration)
router.post("/register", async (req, res) => {
  const { fullname, username, password, required_hours } = req.body || {};
  if (!fullname || !username || !password)
    return res.status(400).json({ message: "All fields are required" });
  if (password.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });

  const [exists] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
  if (exists.length) return res.status(409).json({ message: "Username is already taken" });

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (fullname, username, password, role, required_hours, must_change_password)
     VALUES (?, ?, ?, 'intern', ?, 0)`,
    [fullname, username, hash, Number(required_hours) || 486]
  );
  res.status(201).json({ message: "Account created" });
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth(), async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password)
    return res.status(400).json({ message: "Missing fields" });
  if (new_password.length < 8)
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  if (new_password === "admin")
    return res.status(400).json({ message: "New password cannot be the default" });

  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(current_password, user.password);
  if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

  const hash = await bcrypt.hash(new_password, 10);
  await pool.query(
    "UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?",
    [hash, user.id]
  );
  res.json({ message: "Password updated" });
});

// GET /api/auth/me
router.get("/me", requireAuth(), async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: "Not found" });
  res.json({ user: publicUser(rows[0]) });
});

export default router;
