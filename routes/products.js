const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all products for a category (including watches)
router.get("/:category", (req, res) => {
  const category = req.params.category.toLowerCase();
  let tableName;

  switch (category) {
    case "mens":
      tableName = "MensClothing";
      break;
    case "womens":
      tableName = "WomensClothing";
      break;
    case "kids":
      tableName = "KidsClothing";
      break;
    case "shoes":
      tableName = "Shoes";
      break;
    case "watches":
      tableName = "Watches";
      break;
    default:
      return res.status(400).json({ error: "Invalid category" });
  }

  const query = `SELECT * FROM ${tableName}`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    // Transform all products
    const transformedProducts = results.map((product) => {
      const transformed = {
        ...product,
        Price: Number.parseFloat(product.Price || 0),
        Rating: Number.parseFloat(product.Rating || 0),
      };

      if (tableName === "Watches") {
        transformed.DialSize = Number.parseFloat(product.DialSize || 0);
        transformed.InStock = Boolean(product.InStock);
      } else if (tableName !== "Shoes") {
        transformed.StockQuantity = Number.parseInt(product.StockQuantity || 0);
      } else {
        transformed.HeelHeight = Number.parseFloat(product.HeelHeight || 0);
        transformed.Weight = Number.parseFloat(product.Weight || 0);
        transformed.InStock = Boolean(product.InStock);
        transformed.Waterproof = Boolean(product.Waterproof);
      }

      // Handle Images
      try {
        if (product.Images) {
          if (typeof product.Images === "string") {
            try {
              transformed.Images = JSON.parse(product.Images);
            } catch {
              transformed.Images = [product.Images];
            }
          } else if (Buffer.isBuffer(product.Images)) {
            const base64Image = product.Images.toString("base64");
            transformed.Images = [`data:image/jpeg;base64,${base64Image}`];
          } else if (Array.isArray(product.Images)) {
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

      // Handle ColorsAvailable for Shoes and Watches
      if (
        (tableName === "Shoes" || tableName === "Watches") &&
        product.ColorsAvailable
      ) {
        try {
          transformed.ColorsAvailable = JSON.parse(product.ColorsAvailable);
        } catch (error) {
          console.error("Error parsing ColorsAvailable:", error);
          transformed.ColorsAvailable = [];
        }
      }

      return transformed;
    });

    res.json(transformedProducts);
  });
});

// Get a single product by ID (for all categories including watches)
router.get("/:category/:id", (req, res) => {
  const productId = req.params.id;
  const category = req.params.category.toLowerCase();
  let tableName;

  switch (category) {
    case "mens":
      tableName = "MensClothing";
      break;
    case "womens":
      tableName = "WomensClothing";
      break;
    case "kids":
      tableName = "KidsClothing";
      break;
    case "shoes":
      tableName = "Shoes";
      break;
    case "watches":
      tableName = "Watches";
      break;
    default:
      return res.status(400).json({ error: "Invalid category" });
  }

  const query = `SELECT * FROM ${tableName} WHERE ProductID = ?`;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = results[0];

    // Transform the data to handle special types
    const transformedProduct = {
      ...product,
      Price: Number.parseFloat(product.Price || 0),
      Rating: Number.parseFloat(product.Rating || 0),
    };

    if (tableName === "Watches") {
      transformedProduct.DialSize = Number.parseFloat(product.DialSize || 0);
      transformedProduct.InStock = Boolean(product.InStock);
    } else if (tableName !== "Shoes") {
      transformedProduct.StockQuantity = Number.parseInt(
        product.StockQuantity || 0
      );
    } else {
      transformedProduct.HeelHeight = Number.parseFloat(
        product.HeelHeight || 0
      );
      transformedProduct.Weight = Number.parseFloat(product.Weight || 0);
      transformedProduct.InStock = Boolean(product.InStock);
      transformedProduct.Waterproof = Boolean(product.Waterproof);
    }

    // Handle Images field
    try {
      if (product.Images) {
        if (typeof product.Images === "string") {
          try {
            transformedProduct.Images = JSON.parse(product.Images);
          } catch {
            transformedProduct.Images = [product.Images];
          }
        } else if (Buffer.isBuffer(product.Images)) {
          const base64Image = product.Images.toString("base64");
          transformedProduct.Images = [`data:image/jpeg;base64,${base64Image}`];
        } else if (Array.isArray(product.Images)) {
          transformedProduct.Images = product.Images;
        } else {
          transformedProduct.Images = [product.Images];
        }
      } else {
        transformedProduct.Images = [];
      }
    } catch (error) {
      console.error("Error processing images:", error);
      transformedProduct.Images = [];
    }

    // Handle ColorsAvailable for Shoes and Watches
    if (
      (tableName === "Shoes" || tableName === "Watches") &&
      product.ColorsAvailable
    ) {
      try {
        transformedProduct.ColorsAvailable = JSON.parse(
          product.ColorsAvailable
        );
      } catch (error) {
        console.error("Error parsing ColorsAvailable:", error);
        transformedProduct.ColorsAvailable = [];
      }
    }

    res.json(transformedProduct);
  });
});

module.exports = router;
