-- ============================================================
--  OJT Attendance Tracking System  —  MySQL schema
--  Run this in phpMyAdmin (XAMPP) or via the init-db script.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `ojt_attendance`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ojt_attendance`;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(120) NOT NULL,
  username VARCHAR(60) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','intern') NOT NULL DEFAULT 'intern',
  required_hours INT NOT NULL DEFAULT 486,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- ATTENDANCE (auto via Time In / Time Out) ----------
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  day_name VARCHAR(15) NOT NULL,
  time_in TIME NULL,
  time_out TIME NULL,
  total_hours DECIMAL(5,2) NULL,
  status ENUM('present','incomplete','absent') NOT NULL DEFAULT 'incomplete',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_date (user_id, attendance_date),
  CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- MANUAL ATTENDANCE (back-fill from logbook) ----------
CREATE TABLE IF NOT EXISTS manual_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_manual_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- DAILY REPORTS ----------
CREATE TABLE IF NOT EXISTS daily_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  report_text TEXT NOT NULL,
  report_date DATE NOT NULL,
  is_seen TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- SEED DEFAULT ADMIN ----------
-- username: admin   password: admin   (must_change_password = 1)
-- bcrypt hash for "admin" (cost 10) — regenerate with: node -e "require('bcrypt').hash('admin',10).then(console.log)"
INSERT INTO users (fullname, username, password, role, required_hours, must_change_password)
SELECT 'System Administrator', 'admin',
       '$2b$10$mkOBf56WZ66gRtXeNpf7g.MPXvUuzKf.wGeOZqSmIfMtNAPmKCBEG',
       'admin', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
