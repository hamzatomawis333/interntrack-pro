import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/email-config", requireAuth(["admin"]), async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM email_config LIMIT 1");
    const config = rows[0] || null;
    if (config && config.smtp_pass) {
      config.smtp_pass = "••••••••";
    }
    res.json(config);
  } catch (err) {
    console.error("EMAIL CONFIG GET ERROR:", err);
    res.status(500).json({ message: "Failed to load email config" });
  }
});

router.put("/email-config", requireAuth(["admin"]), async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name, is_enabled } =
      req.body;

    const [existing] = await pool.query("SELECT id FROM email_config LIMIT 1");

    const updates = {
      smtp_host: smtp_host || null,
      smtp_port: smtp_port || 587,
      smtp_user: smtp_user || null,
      smtp_pass: smtp_pass || null,
      from_email: from_email || null,
      from_name: from_name || "OJT Tracker",
      is_enabled: is_enabled ? 1 : 0,
    };

    if (existing.length > 0) {
      const sets = Object.keys(updates)
        .map((k) => `${k} = ?`)
        .join(", ");
      const vals = Object.values(updates);

      if (!smtp_pass) {
        await pool.query(
          `UPDATE email_config SET smtp_host = ?, smtp_port = ?, smtp_user = ?, from_email = ?, from_name = ?, is_enabled = ? WHERE id = ?`,
          [
            updates.smtp_host,
            updates.smtp_port,
            updates.smtp_user,
            updates.from_email,
            updates.from_name,
            updates.is_enabled,
            existing[0].id,
          ],
        );
      } else {
        await pool.query(`UPDATE email_config SET ${sets} WHERE id = ?`, [...vals, existing[0].id]);
      }
    } else {
      await pool.query(
        "INSERT INTO email_config (smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          updates.smtp_host,
          updates.smtp_port,
          updates.smtp_user,
          updates.smtp_pass,
          updates.from_email,
          updates.from_name,
          updates.is_enabled,
        ],
      );
    }

    res.json({ message: "Email configuration saved" });
  } catch (err) {
    console.error("EMAIL CONFIG PUT ERROR:", err);
    res.status(500).json({ message: "Failed to save email config" });
  }
});

router.get("/email-notifications", requireAuth(["admin"]), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM email_notifications");

    const [rows] = await pool.query(
      "SELECT id, recipient_email, subject, notification_type, is_sent, sent_at, created_at FROM email_notifications ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
    );

    res.json({ notifications: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("EMAIL NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

export default router;
