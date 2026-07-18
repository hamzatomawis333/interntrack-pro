import { pool } from "../db.js";

export async function logAudit(adminId, adminName, action, details = null, ipAddress = null) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (admin_id, admin_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
      [adminId, adminName, action, details, ipAddress],
    );
  } catch (err) {
    console.error("[audit] Failed to log:", err.message);
  }
}
