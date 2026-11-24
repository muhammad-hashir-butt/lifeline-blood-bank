require("dotenv").config();

const connectDB = require("./config/db");
const { createApp } = require("./app");

const app = createApp();
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Lifeline API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

module.exports = app;
