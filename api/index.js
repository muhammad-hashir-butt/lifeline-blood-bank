/**
 * Vercel serverless entry — serves Express API under /api/*
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Never load local server/.env on Vercel — it often points to 127.0.0.1 and breaks production.
if (!process.env.VERCEL) {
  try {
    require("dotenv").config({ path: path.join(__dirname, "../server/.env") });
  } catch {
    // ignore
  }
}

const connectDB = require("../server/src/config/db");
const { createApp } = require("../server/src/app");
const { ensureSeedUsers } = require("../server/src/scripts/bootstrap");

const app = createApp();

let ready;
async function ensureReady() {
  if (!ready) {
    ready = (async () => {
      await connectDB();
      await ensureSeedUsers();
    })();
  }
  return ready;
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

  if (!String(req.url || "").startsWith("/api/") && req.headers["x-match-path"]) {
    req.url = req.headers["x-match-path"];
  }
}

export default async function handler(req, res) {
  try {
    await ensureReady();
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
