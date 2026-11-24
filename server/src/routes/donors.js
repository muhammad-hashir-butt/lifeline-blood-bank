const express = require("express");
const Donor = require("../models/Donor");
const DonationHistory = require("../models/DonationHistory");
const { authenticate, authorize } = require("../middleware/auth");
const { CITY_COORDS } = require("../utils/cityCoords");
const { serializeDoc, serializeMany } = require("../utils/serialize");
const { donorReadFilter } = require("../utils/rbac");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const donors = await Donor.find(donorReadFilter(req.user)).sort({ created_at: -1 });
    res.json(serializeMany(donors));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/count", authenticate, async (req, res) => {
  try {
    const count = await Donor.countDocuments(donorReadFilter(req.user));
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const { name, blood_group, phone, city, email, last_donation_date } = req.body;
    if (!name || !phone || !blood_group) {
      return res.status(400).json({ message: "Name, phone, and blood group are required" });
    }

    const donorCity = city || req.user.city || "Lahore";
    if (req.user.role === "ngo" && donorCity !== req.user.city) {
      return res.status(403).json({ message: "NGO can only register donors in their city" });
    }
    if (req.user.role === "hospital" && donorCity !== req.user.city) {
      return res.status(403).json({ message: "Hospital can only register donors in their city" });
    }

    const coords = CITY_COORDS[donorCity] || CITY_COORDS.Lahore;
    const donor = await Donor.create({
      name,
      email: email || "",
      blood_group,
      phone,
      city: donorCity,
      latitude: coords.lat,
      longitude: coords.lng,
      last_donation_date: last_donation_date || null,
    });
    res.status(201).json(serializeDoc(donor));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", authenticate, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    if (req.user.role === "donor" && String(donor.user_id || "") !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (
      (req.user.role === "hospital" || req.user.role === "ngo") &&
      donor.city !== req.user.city
    ) {
      return res.status(403).json({ message: "Not allowed to edit donors outside your city" });
    }

    const fields = ["name", "phone", "email", "city", "blood_group", "last_donation_date"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) donor[f] = req.body[f];
    });
    if (req.body.city) {
      const coords = CITY_COORDS[req.body.city] || CITY_COORDS.Lahore;
      donor.latitude = coords.lat;
      donor.longitude = coords.lng;
    }
    await donor.save();
    res.json(serializeDoc(donor));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    if (
      (req.user.role === "hospital" || req.user.role === "ngo") &&
      donor.city !== req.user.city
    ) {
      return res.status(403).json({ message: "Not allowed to delete donors outside your city" });
    }
    await DonationHistory.deleteMany({ donor_id: donor._id });
    await donor.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/donate", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    if (
      (req.user.role === "hospital" || req.user.role === "ngo") &&
      donor.city !== req.user.city
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const hospital_name =
      req.body.hospital_name ||
      (req.user.role === "hospital" ? req.user.full_name : "Unknown Hospital");

    const history = await DonationHistory.create({
      donor_id: donor._id,
      hospital_name,
      blood_group: donor.blood_group,
      units: Number(req.body.units || 1),
      donated_at: today,
      notes: req.body.notes || "Recorded via Lifeline Portal",
    });

    donor.last_donation_date = today;
    await donor.save();

    res.status(201).json({
      donor: serializeDoc(donor),
      history: serializeDoc(history),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/history", authenticate, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    if (req.user.role === "donor" && String(donor.user_id || "") !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (
      (req.user.role === "hospital" || req.user.role === "ngo") &&
      donor.city !== req.user.city
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const rows = await DonationHistory.find({ donor_id: donor._id }).sort({ donated_at: -1 });
    res.json(serializeMany(rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
