import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/profile-picture", requireAuth(), async (req, res) => {
  try {
    const { image_data, mime_type } = req.body;

    if (!image_data) {
      return res.status(400).json({ message: "No image data provided" });
    }

    const mime = mime_type || "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime)) {
      return res
        .status(400)
        .json({ message: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." });
    }

    const rawSize = Math.ceil((image_data.length * 3) / 4);
    if (rawSize > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Image too large. Maximum 5MB." });
    }

    const [existing] = await pool.query("SELECT id FROM profile_pictures WHERE user_id = ?", [
      req.user.id,
    ]);

    if (existing.length > 0) {
      await pool.query(
        "UPDATE profile_pictures SET image_data = ?, mime_type = ?, file_size = ? WHERE user_id = ?",
        [image_data, mime, rawSize, req.user.id],
      );
    } else {
      await pool.query(
        "INSERT INTO profile_pictures (user_id, image_data, mime_type, file_size) VALUES (?, ?, ?, ?)",
        [req.user.id, image_data, mime, rawSize],
      );
    }

    res.json({ message: "Profile picture updated" });
  } catch (err) {
    console.error("PROFILE PICTURE UPLOAD ERROR:", err);
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
});

router.get("/auth/profile-picture/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT image_data, mime_type FROM profile_pictures WHERE user_id = ?",
      [req.params.userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No profile picture" });
    }

    res.json({ image_data: rows[0].image_data, mime_type: rows[0].mime_type });
  } catch (err) {
    console.error("PROFILE PICTURE GET ERROR:", err);
    res.status(500).json({ message: "Failed to load profile picture" });
  }
});

router.get("/auth/my-profile-picture", requireAuth(), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT image_data, mime_type FROM profile_pictures WHERE user_id = ?",
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No profile picture" });
    }

    res.json({ image_data: rows[0].image_data, mime_type: rows[0].mime_type });
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile picture" });
  }
});

router.delete("/auth/profile-picture", requireAuth(), async (req, res) => {
  try {
    await pool.query("DELETE FROM profile_pictures WHERE user_id = ?", [req.user.id]);
    res.json({ message: "Profile picture removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove profile picture" });
  }
});

export default router;
