import express from "express";
import { pool } from "../db.js";
import { signToken } from "../middleware/auth.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];

    const valid = user.password.startsWith("$2")
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!valid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    return res.json({
      message: "login success",
      token: signToken({
        id: user.id,
        username: user.username,
        role: user.role,
      }),
      user,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// 👇 ADD LANG NATIN ITO
router.post("/register", async (req, res) => {
  try {
    const { fullname, username, password } = req.body || {};

    if (!fullname || !username || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // check duplicate username
    const [existing] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);

    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (fullname, username, password, role, required_hours, must_change_password)
       VALUES (?, ?, ?, 'intern', 486, 0)`,
      [fullname, username, hashed],
    );

    return res.status(201).json({
      message: "Account created",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
    const payload = jwt.verify(token, SECRET);

    const { current_password, new_password } = req.body || {};

    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (new_password.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [payload.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const valid = user.password.startsWith("$2")
      ? await bcrypt.compare(current_password, user.password)
      : user.password === current_password;

    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?", [
      hashed,
      payload.id,
    ]);

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
    const payload = jwt.verify(token, SECRET);

    const { fullname } = req.body || {};

    if (!fullname || !fullname.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    await pool.query("UPDATE users SET fullname = ? WHERE id = ?", [fullname.trim(), payload.id]);

    const [rows] = await pool.query(
      "SELECT id, fullname, username, role, required_hours, must_change_password FROM users WHERE id = ?",
      [payload.id],
    );

    return res.json({ message: "Profile updated", user: rows[0] });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
