// ============================================================
//  Migration: Add audit_logs, profile_pictures, email_config,
//             users.email, notifications
//  Run: node scripts/migrate.js
// ============================================================
import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ojt_attendance",
  multipleStatements: true,
});

const migrations = [
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL,
    admin_name VARCHAR(120) NOT NULL DEFAULT 'System',
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS profile_pictures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_data LONGTEXT NOT NULL,
    mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
    file_size INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_pp (user_id),
    CONSTRAINT fk_pp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS email_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_host VARCHAR(255) NULL,
    smtp_port INT NULL DEFAULT 587,
    smtp_user VARCHAR(255) NULL,
    smtp_pass VARCHAR(255) NULL,
    from_email VARCHAR(255) NULL,
    from_name VARCHAR(120) NULL DEFAULT 'OJT Tracker',
    is_enabled TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS email_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_sent TINYINT(1) NOT NULL DEFAULT 0,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient_email),
    INDEX idx_is_sent (is_sent)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    link VARCHAR(255) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (notification_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB`,
];

console.log("Running migrations...");

for (const sql of migrations) {
  await conn.query(sql);
}

// Add email column to users if it doesn't exist
const [cols] = await conn.query("SHOW COLUMNS FROM users LIKE 'email'");
if (cols.length === 0) {
  await conn.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER username");
  console.log("✔ Added email column to users table");
}

const [idxRows] = await conn.query("SHOW INDEX FROM users WHERE Key_name = 'uniq_users_email'");
if (idxRows.length === 0) {
  await conn.query("ALTER TABLE users ADD UNIQUE INDEX uniq_users_email (email)");
  console.log("✔ Added unique index on users.email");
}

console.log("✔ All migrations completed successfully.");
await conn.end();
