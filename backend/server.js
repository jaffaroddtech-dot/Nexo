require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes/index");

const app = express();

// Connect to MongoDB
connectDB();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "NEXO API is running", status: true });
});

// Mount all routes from routes/index.js
for (let route in routes) {
  app.use(route, routes[route]);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", status: false });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message, status: false });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NEXO server running on port ${PORT}`);
});
