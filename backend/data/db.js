const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB || "health", 
  password: process.env.POSTGRES_PASSWORD || "123456789",
  port: process.env.POSTGRES_PORT || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to PostgreSQL:", err.stack);
  } else {
    console.log("Connected to PostgreSQL successfully");
    release();
  }
});

module.exports = pool;
