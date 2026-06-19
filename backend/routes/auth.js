import express from "express";
import { pool } from "../db.js";
import { signToken } from "../middleware/auth.js";
import bcrypt from "bcrypt";

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

    // INSERT USER
    const [result] = await pool.query(
      `INSERT INTO users (fullname, username, password, role, required_hours, must_change_password)
       VALUES (?, ?, ?, 'intern', 486, 0)`,
      [fullname, username, password],
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

export default router;
