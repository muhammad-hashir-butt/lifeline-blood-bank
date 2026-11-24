/**
 * Vercel serverless entry — serves Express API under /api/*
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  require("dotenv").config({ path: path.join(__dirname, "../server/.env") });
} catch {
  // Vercel uses dashboard env vars
}

const connectDB = require("../server/src/config/db");
const { createApp } = require("../server/src/app");

const app = createApp();

let dbReady;
function ensureDb() {
  if (!dbReady) dbReady = connectDB();
  return dbReady;
}

function restoreApiPath(req) {
  // When Vercel rewrites /api/auth/login → /api, restore the original path for Express.
  const original =
    req.headers["x-forwarded-uri"] ||
    req.headers["x-invoke-path"] ||
    req.headers["x-vercel-forwarded-path"] ||
    "";

  if (typeof original === "string" && original.startsWith("/api/") && req.url === "/api") {
    req.url = original.split("?")[0] + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
  }

  // Fallback: use x-match-path / raw url if provided
  if (!String(req.url || "").startsWith("/api/") && req.headers["x-match-path"]) {
    req.url = req.headers["x-match-path"];
  }
}

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: err.message || "Database connection failed" }));
    return;
  }

  restoreApiPath(req);
  return app(req, res);
}
