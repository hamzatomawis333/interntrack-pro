// Email notification service — stores in DB; ready for SMTP integration
import { pool } from "../db.js";

let transporter = null;

async function loadConfig() {
  const [rows] = await pool.query("SELECT * FROM email_config LIMIT 1");
  return rows[0] || null;
}

async function getTransporter() {
  if (transporter) return transporter;
  const config = await loadConfig();
  if (!config || !config.is_enabled || !config.smtp_host) return null;
  const nodemailer = await import("nodemailer").catch(() => null);
  if (!nodemailer) return null;
  transporter = nodemailer.default.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    secure: (config.smtp_port || 587) === 465,
    auth: config.smtp_user ? { user: config.smtp_user, pass: config.smtp_pass } : undefined,
  });
  return transporter;
}

export async function sendNotification(to, subject, body, type = "general") {
  await pool.query(
    "INSERT INTO email_notifications (recipient_email, subject, body, notification_type) VALUES (?, ?, ?, ?)",
    [to, subject, body, type],
  );

  const transport = await getTransporter();
  const config = await loadConfig();

  if (transport && config?.is_enabled) {
    try {
      await transport.sendMail({
        from: config.from_email || "noreply@ojt-tracker.local",
        to,
        subject,
        html: body,
      });
      await pool.query(
        "UPDATE email_notifications SET is_sent = 1, sent_at = NOW() WHERE recipient_email = ? AND subject = ? AND is_sent = 0 ORDER BY id DESC LIMIT 1",
        [to, subject],
      );
      return { success: true, queued: false };
    } catch (err) {
      console.error("[email] SMTP send failed, stored in queue:", err.message);
      return { success: true, queued: true, note: "SMTP failed, stored in queue" };
    }
  }

  return { success: true, queued: true, note: "Email stored — SMTP not configured" };
}

export function registrationEmail(fullname, username) {
  const subject = "Welcome to OJT Tracker";
  const body = `
    <div style="font-family:sans-serif;padding:24px;background:#f8fafc;">
      <h2 style="color:#0f172a;">Welcome, ${fullname}!</h2>
      <p>Your intern account has been created.</p>
      <table style="margin:16px 0;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;">
        <tr><td style="color:#64748b;padding-right:12px;">Username:</td><td style="font-weight:600;">${username}</td></tr>
      </table>
      <p style="color:#64748b;font-size:13px;">Please log in and change your password to get started.</p>
    </div>`;
  return { subject, body };
}

export function attendanceEmail(fullname, action, hoursWorked, dateStr) {
  const subject = `Attendance Recorded — ${action}`;
  const body = `
    <div style="font-family:sans-serif;padding:24px;background:#f8fafc;">
      <h2 style="color:#0f172a;">Attendance: ${action}</h2>
      <p><strong>${fullname}</strong> has recorded <strong>${action.toLowerCase()}</strong>.</p>
      <table style="margin:16px 0;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;">
        <tr><td style="color:#64748b;padding-right:12px;">Date:</td><td>${dateStr}</td></tr>
        <tr><td style="color:#64748b;padding-right:12px;">Hours today:</td><td>${hoursWorked}h</td></tr>
      </table>
    </div>`;
  return { subject, body };
}

export function reportEmail(fullname, contentPreview) {
  const subject = "New Intern Report Submitted";
  const body = `
    <div style="font-family:sans-serif;padding:24px;background:#f8fafc;">
      <h2 style="color:#0f172a;">New Report</h2>
      <p><strong>${fullname}</strong> has submitted a new daily report.</p>
      <blockquote style="margin:16px 0;padding:12px;background:#fff;border-radius:8px;border-left:4px solid #6366f1;color:#334155;">
        ${contentPreview.length > 200 ? contentPreview.slice(0, 200) + "…" : contentPreview}
      </blockquote>
    </div>`;
  return { subject, body };
}
