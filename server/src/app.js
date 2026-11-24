const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const donorRoutes = require("./routes/donors");
const requestRoutes = require("./routes/requests");
const alertRoutes = require("./routes/alerts");
const dashboardRoutes = require("./routes/dashboard");
const predictionRoutes = require("./routes/prediction");

function mountApiRoutes(router) {
  router.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "lifeline-api" });
  });

  router.use("/auth", authRoutes);
  router.use("/dashboard", dashboardRoutes);
  router.use("/inventory", inventoryRoutes);
  router.use("/donors", donorRoutes);
  router.use("/requests", requestRoutes);
  router.use("/alerts", alertRoutes);
  router.use("/prediction", predictionRoutes);
}

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          return callback(null, true);
        }
        if (/^https:\/\/lifeline-blood-bank([a-z0-9-]+)?\.vercel\.app$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());
  app.use(morgan("dev"));

  // Local + same-origin: /api/...
  const api = express.Router();
  mountApiRoutes(api);
  app.use("/api", api);

  // Vercel rewrite fallback when /api prefix is stripped before hitting Express
  if (process.env.VERCEL) {
    mountApiRoutes(app);
  }

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  });

  return app;
}

module.exports = { createApp };
