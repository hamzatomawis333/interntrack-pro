import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET === "change-me-to-a-long-random-string") {
  console.warn("WARNING: JWT_SECRET is not set or is using the default value. Set a secure secret in .env");
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function requireAuth(roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
      const payload = jwt.verify(token, SECRET || "dev-secret-change-me");
      req.user = payload;

      if (roles && roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}
