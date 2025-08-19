const jwt = require("jsonwebtoken");
const pool = require("../data/db"); // PostgreSQL connection

// Middleware للتحقق من التوثيق
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId]);
    const user = userResult.rows[0];

    if (!user) return res.status(401).json({ message: "Token is not valid" });

    req.user = user; // حفظ بيانات المستخدم في req.user
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware للتحقق من الصلاحيات
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
