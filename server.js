const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const productRoutes = require("./routes/products");

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database.");
});

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error(
    "JWT_SECRET or JWT_REFRESH_SECRET is not set in the environment variables."
  );
  process.exit(1);
}

function generateTokens(user) {
  const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token expired", code: "TOKEN_EXPIRED" });
      }
      return res.status(403).json({ message: "Failed to authenticate token" });
    }
    req.userId = decoded.id;
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!", details: err.message });
});

// Routes
app.use("/api/products", productRoutes);

// Top products route with error handling
app.get("/api/top-products", (req, res) => {
  const query = `
    (SELECT *, 'mens' as Category FROM MensClothing ORDER BY Rating DESC LIMIT 3)
    UNION ALL
    (SELECT *, 'womens' as Category FROM WomensClothing ORDER BY Rating DESC LIMIT 3)
    UNION ALL
    (SELECT *, 'kids' as Category FROM KidsClothing ORDER BY Rating DESC LIMIT 3)
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching top products:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    // Transform the results to handle BLOB and other special data types
    const transformedResults = results.map((product) => {
      const transformed = {
        ...product,
        Price: Number.parseFloat(product.Price || 0),
        Rating: Number.parseFloat(product.Rating || 0),
        StockQuantity: Number.parseInt(product.StockQuantity || 0),
      };

      // Handle Images field
      try {
        if (product.Images) {
          // If Images is stored as a JSON string
          if (typeof product.Images === "string") {
            try {
              transformed.Images = JSON.parse(product.Images);
            } catch {
              transformed.Images = [product.Images];
            }
          }
          // If Images is stored as a Buffer (BLOB)
          else if (Buffer.isBuffer(product.Images)) {
            const base64Image = product.Images.toString("base64");
            transformed.Images = [`data:image/jpeg;base64,${base64Image}`];
          }
          // If Images is already an array
          else if (Array.isArray(product.Images)) {
            transformed.Images = product.Images;
          } else {
            transformed.Images = [product.Images];
          }
        } else {
          transformed.Images = [];
        }
      } catch (error) {
        console.error("Error processing images:", error);
        transformed.Images = [];
      }

      return transformed;
    });

    res.json(transformedResults);
  });
});

// Signup route
app.post("/api/signup", async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    // Check if user already exists
    const [existingUser] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
        [full_name, email, hashedPassword]
      );

    const newUser = { id: result.insertId, email };
    const { accessToken, refreshToken } = generateTokens(newUser);

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);

  try {
    // Find user
    const [users] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password doesn't match");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create and send JWT token
    const { accessToken, refreshToken } = generateTokens(user);

    console.log("Login successful for user:", user.id);

    // Include more user data in the response
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Update the user profile route
app.get("/api/user-profile", verifyToken, async (req, res) => {
  try {
    const [results] = await db
      .promise()
      .query(
        "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
        [req.userId]
      );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];
    console.log("User profile fetched successfully:", user.id);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

// Token refresh route
app.post("/api/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const [user] = await db
      .promise()
      .query("SELECT id, email FROM users WHERE id = ?", [decoded.id]);

    if (!user[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user[0]
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
