const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Donor = require("../models/Donor");
const { CITY_COORDS } = require("../utils/cityCoords");
const { serializeDoc } = require("../utils/serialize");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id || user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, city, phone, bloodGroup } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!["admin", "donor", "hospital", "ngo"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      full_name: name,
      email,
      password,
      role,
      city: city || "Lahore",
      phone: phone || "",
      blood_group: role === "donor" ? bloodGroup || "O+" : null,
    });

    if (role === "donor") {
      const coords = CITY_COORDS[city] || CITY_COORDS.Lahore;
      await Donor.create({
        user_id: user._id,
        name,
        email: email.toLowerCase(),
        blood_group: bloodGroup || "O+",
        phone: phone || "0300-0000000",
        city: city || "Lahore",
        latitude: coords.lat,
        longitude: coords.lng,
        last_donation_date: null,
      });
    }

    const profile = serializeDoc(user);
    const token = signToken(user);
    res.status(201).json({ token, user: profile, profile });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    const profile = serializeDoc(user);
    const token = signToken(user);
    res.json({ token, user: profile, profile });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message || "Login failed" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user, profile: req.user });
});

module.exports = router;
