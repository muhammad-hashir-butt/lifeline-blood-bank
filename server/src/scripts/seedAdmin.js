require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

async function seedAdmin() {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || "admin@lifeline.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const full_name = process.env.ADMIN_NAME || "Lifeline Admin";

  let admin = await User.findOne({ email: email.toLowerCase() });
  if (admin) {
    admin.role = "admin";
    admin.full_name = full_name;
    admin.city = admin.city || "Lahore";
    admin.phone = admin.phone || "0300-0000000";
    if (password) {
      admin.password = password;
    }
    await admin.save();
    console.log("Admin account updated:");
  } else {
    admin = await User.create({
      full_name,
      email,
      password,
      role: "admin",
      city: "Lahore",
      phone: "0300-0000000",
    });
    console.log("Admin account created:");
  }

  console.log({
    email: admin.email,
    password,
    role: admin.role,
    name: admin.full_name,
  });

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
