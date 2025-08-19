const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002; // استخدم نفس الـ PORT في .env

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/visits", require("./routes/visits"));
app.use("/api/doctors", require("./routes/doctors"));

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    res.json({ 
      message: "Healthcare API is running with PostgreSQL!", 
      timestamp: new Date(),
      status: "OK" 
    });
  } catch (error) {
    res.status(500).json({ message: "Health check failed", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
