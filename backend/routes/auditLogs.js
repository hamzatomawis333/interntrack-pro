import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/audit-logs", requireAuth(["admin"]), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (req.query.action) {
      where.push("al.action LIKE ?");
      params.push(`%${req.query.action}%`);
    }
    if (req.query.admin_id) {
      where.push("al.admin_id = ?");
      params.push(Number(req.query.admin_id));
    }
    if (req.query.date_from) {
      where.push("al.created_at >= ?");
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      where.push("al.created_at <= ?");
      params.push(req.query.date_to + " 23:59:59");
    }
    if (req.query.search) {
      where.push("(al.admin_name LIKE ? OR al.action LIKE ? OR al.details LIKE ?)");
      params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`,
      params,
    );

    const [rows] = await pool.query(
      `SELECT al.*, u.username as admin_username
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.json({
      logs: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("AUDIT LOGS ERROR:", err);
    res.status(500).json({ message: "Failed to load audit logs" });
  }
});

export default router;
