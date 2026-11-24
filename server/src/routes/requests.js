const express = require("express");
const Request = require("../models/Request");
const Inventory = require("../models/Inventory");
const Donor = require("../models/Donor");
const Alert = require("../models/Alert");
const { authenticate, authorize } = require("../middleware/auth");
const { CITY_COORDS } = require("../utils/cityCoords");
const { sendEmail } = require("../utils/email");
const { serializeDoc, serializeMany } = require("../utils/serialize");
const { requestReadFilter, canManageInventoryItem } = require("../utils/rbac");

const router = express.Router();

function distanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function isEligible(lastDate) {
  if (!lastDate) return true;
  const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  return days >= 90;
}

router.get("/", authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    let query = Request.find(requestReadFilter(req.user)).sort({ created_at: -1 });
    if (limit) query = query.limit(limit);
    const rows = await query;
    res.json(serializeMany(rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const { hospital_name, city, blood_group, units, urgency } = req.body;
    if (!hospital_name || !units || !blood_group) {
      return res.status(400).json({ message: "Hospital name, blood group, and units are required" });
    }

    const reqCity = city || req.user.city || "Lahore";
    if (req.user.role === "ngo" && reqCity !== req.user.city) {
      return res.status(403).json({ message: "NGO can only create requests in their city" });
    }

    const row = await Request.create({
      hospital_name:
        req.user.role === "hospital" ? req.user.full_name || hospital_name : hospital_name,
      city: req.user.role === "hospital" ? req.user.city || reqCity : reqCity,
      blood_group,
      units: Number(units),
      urgency: urgency || "high",
      status: "pending",
      created_by: req.user.id,
    });
    res.status(201).json(serializeDoc(row));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/match", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const reqCoords = CITY_COORDS[request.city] || CITY_COORDS.Lahore;
    const [stocks, donors] = await Promise.all([
      Inventory.find({ units: { $gt: 0 } }),
      Donor.find({}),
    ]);

    const matchedStock = serializeMany(
      stocks
        .filter((i) => i.blood_group === request.blood_group || i.blood_group === "O-")
        .sort((a, b) => (a.city === request.city ? -1 : b.city === request.city ? 1 : b.units - a.units))
    );

    const matchedDonors = donors
      .filter(
        (d) =>
          isEligible(d.last_donation_date) &&
          (d.blood_group === request.blood_group || d.blood_group === "O-")
      )
      .map((d) => {
        const dCoords =
          d.latitude && d.longitude
            ? { lat: d.latitude, lng: d.longitude }
            : CITY_COORDS[d.city] || CITY_COORDS.Lahore;
        const serialized = serializeDoc(d);
        serialized.distance = distanceKm(reqCoords.lat, reqCoords.lng, dCoords.lat, dCoords.lng);
        return serialized;
      })
      .sort((a, b) => a.distance - b.distance);

    res.json({
      request: serializeDoc(request),
      matchedStock,
      matchedDonors,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/allocate", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const stock = await Inventory.findById(req.body.inventory_id);
    if (!stock) return res.status(404).json({ message: "Inventory item not found" });

    // Hospital may only allocate from stock they manage (admin/ngo more flexible)
    if (req.user.role === "hospital" && !canManageInventoryItem(req.user, stock)) {
      // still allow allocate from any stock for emergency network matching
    }

    request.status = "matched";
    request.matched_source = `${stock.hospital_name} (${stock.city})`;
    await request.save();

    stock.units = Math.max(0, stock.units - request.units);
    await stock.save();

    res.json({
      request: serializeDoc(request),
      inventory: serializeDoc(stock),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/alert-donors", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const reqCoords = CITY_COORDS[request.city] || CITY_COORDS.Lahore;
    const donors = await Donor.find({});
    const matchedDonors = donors
      .filter(
        (d) =>
          isEligible(d.last_donation_date) &&
          (d.blood_group === request.blood_group || d.blood_group === "O-")
      )
      .map((d) => {
        const dCoords =
          d.latitude && d.longitude
            ? { lat: d.latitude, lng: d.longitude }
            : CITY_COORDS[d.city] || CITY_COORDS.Lahore;
        return {
          donor: d,
          distance: distanceKm(reqCoords.lat, reqCoords.lng, dCoords.lat, dCoords.lng),
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    const createdAlerts = [];
    for (const { donor, distance } of matchedDonors) {
      const message = `URGENT: ${request.hospital_name} (${request.city}) needs ${request.units} unit(s) of ${request.blood_group} blood (${distance} km away).`;
      const emailResult = await sendEmail({
        to: donor.email,
        subject: `Lifeline Emergency: ${request.blood_group} blood needed in ${request.city}`,
        text: message,
      });

      const alert = await Alert.create({
        request_id: request._id,
        recipient_name: donor.name,
        recipient_phone: donor.phone,
        recipient_email: donor.email || "",
        city: donor.city,
        blood_group: request.blood_group,
        message,
        channel: "email",
        status: emailResult.skipped ? "logged" : "sent",
        created_by: req.user.id,
      });
      createdAlerts.push(serializeDoc(alert));
    }

    request.status = "matched";
    request.matched_source = `Email Alerted ${matchedDonors.length} nearby donor(s)`;
    await request.save();

    res.json({
      request: serializeDoc(request),
      alerts: createdAlerts,
      count: matchedDonors.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (
      req.user.role !== "admin" &&
      String(request.created_by) !== req.user.id &&
      request.city !== req.user.city
    ) {
      return res.status(403).json({ message: "Not allowed to update this request" });
    }

    if (req.body.status) request.status = req.body.status;
    if (req.body.matched_source !== undefined) request.matched_source = req.body.matched_source;
    await request.save();
    res.json(serializeDoc(request));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    await request.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
