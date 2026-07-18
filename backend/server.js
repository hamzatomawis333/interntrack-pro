import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendance.js";
import reportRoutes from "./routes/reports.js";
import adminDailyReportsRoutes from "./routes/adminDailyReports.js";
import auditLogsRoutes from "./routes/auditLogs.js";
import profilePicturesRoutes from "./routes/profilePictures.js";
import emailConfigRoutes from "./routes/emailConfig.js";

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use(express.json());

/* =========================
   HEALTH
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/daily-reports", adminDailyReportsRoutes);
app.use("/api/admin", auditLogsRoutes);
app.use("/api/admin", emailConfigRoutes);
app.use("/api", profilePicturesRoutes);
app.use("/api/admin", adminRoutes);

/* =========================================================
   START SERVER
========================================================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
