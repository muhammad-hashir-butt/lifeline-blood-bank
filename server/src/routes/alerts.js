const express = require("express");
const Alert = require("../models/Alert");
const Donor = require("../models/Donor");
const { authenticate, authorize } = require("../middleware/auth");
const { sendEmail } = require("../utils/email");
const { serializeDoc, serializeMany } = require("../utils/serialize");
const { alertReadFilter } = require("../utils/rbac");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const alerts = await Alert.find(alertReadFilter(req.user)).sort({ created_at: -1 });
    res.json(serializeMany(alerts));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/broadcast", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const { blood_group, city, hospital_name } = req.body;
    if (!blood_group || !city || !hospital_name) {
      return res.status(400).json({ message: "Blood group, city, and hospital name are required" });
    }

    if (req.user.role === "ngo" && city !== req.user.city) {
      return res.status(403).json({ message: "NGO can only broadcast in their city" });
    }
    if (req.user.role === "hospital" && city !== req.user.city) {
      return res.status(403).json({ message: "Hospital can only broadcast in their city" });
    }

    const donors = await Donor.find({ city });
    const matching = donors.filter(
      (d) => d.blood_group === blood_group || d.blood_group === "O-"
    );

    if (matching.length === 0) {
      return res.status(404).json({
        message: `No donors with ${blood_group} or O- found in ${city}.`,
      });
    }

    const created = [];
    for (const d of matching) {
      const message = `EMERGENCY ALERT: ${hospital_name} in ${city} urgently needs ${blood_group} blood donors.`;
      const emailResult = await sendEmail({
        to: d.email,
        subject: `Lifeline Alert: ${blood_group} donors needed in ${city}`,
        text: message,
      });

      const alert = await Alert.create({
        recipient_name: d.name,
        recipient_phone: d.phone,
        recipient_email: d.email || "",
        city: d.city,
        blood_group,
        message,
        channel: "email",
        status: emailResult.skipped ? "logged" : "sent",
        created_by: req.user.id,
      });
      created.push(serializeDoc(alert));
    }

    res.status(201).json({ alerts: created, count: created.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
