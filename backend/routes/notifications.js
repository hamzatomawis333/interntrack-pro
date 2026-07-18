import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function createNotification(type, title, description, link = null) {
  return pool.query(
    "INSERT INTO notifications (notification_type, title, description, link) VALUES (?, ?, ?, ?)",
    [type, title, description, link],
  );
}

router.get("/notifications", requireAuth(["admin"]), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (req.query.type) {
      where.push("n.notification_type = ?");
      params.push(req.query.type);
    }
    if (req.query.is_read !== undefined && req.query.is_read !== "") {
      where.push("n.is_read = ?");
      params.push(Number(req.query.is_read));
    }
    if (req.query.search) {
      where.push("(n.title LIKE ? OR n.description LIKE ?)");
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`,
      params,
    );

    const [rows] = await pool.query(
      `SELECT n.* FROM notifications n ${whereClause} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.json({
      notifications: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.get("/notifications/unread-count", requireAuth(["admin"]), async (_req, res) => {
  try {
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE is_read = 0",
    );
    res.json({ count });
  } catch (err) {
    console.error("UNREAD COUNT ERROR:", err);
    res.status(500).json({ message: "Failed to get unread count" });
  }
});

router.put("/notifications/:id/read", requireAuth(["admin"]), async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

router.put("/notifications/read-all", requireAuth(["admin"]), async (_req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
    res.json({ message: "All marked as read" });
  } catch (err) {
    console.error("MARK ALL READ ERROR:", err);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
});

router.delete("/notifications/:id", requireAuth(["admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

export { createNotification };
export default router;
