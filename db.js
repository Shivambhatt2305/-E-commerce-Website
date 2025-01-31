const mysql = require("mysql2");
require("dotenv").config();

// Create the connection with explicit credentials
const db = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD, // This will be set from your .env file
  database: process.env.DB_NAME || "blendbazaar",
  port: process.env.DB_PORT || 3306,
});

// Add error handling for the connection
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    console.log("Environment variables:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      // Don't log the password for security reasons
    });
    return;
  }
  console.log("Connected to MySQL database");
});

// Handle errors after initial connection
db.on("error", (err) => {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("Database connection was closed.");
  }
  if (err.code === "ER_CON_COUNT_ERROR") {
    console.error("Database has too many connections.");
  }
  if (err.code === "ECONNREFUSED") {
    console.error("Database connection was refused.");
  }
});

module.exports = db;
