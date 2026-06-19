import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendance.js"; // 👈 ADD THIS

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:8081"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🔥 AUTH ROUTES
app.use("/api/auth", authRoutes);

// 🔥 ATTENDANCE ROUTES (FIX FOR 404 ISSUE)
app.use("/api/attendance", attendanceRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
