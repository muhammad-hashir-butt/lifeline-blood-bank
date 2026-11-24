const express = require("express");
const Inventory = require("../models/Inventory");
const { authenticate, authorize } = require("../middleware/auth");
const { serializeDoc, serializeMany } = require("../utils/serialize");
const {
  inventoryReadFilter,
  canManageInventoryItem,
} = require("../utils/rbac");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const items = await Inventory.find(inventoryReadFilter(req.user)).sort({ units: 1 });
    res.json(serializeMany(items));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const { blood_group, units, hospital_name, city, expiry_date } = req.body;
    if (!blood_group || units === undefined || !hospital_name || !city || !expiry_date) {
      return res.status(400).json({ message: "All inventory fields are required" });
    }

    // NGO can only add stock for their own city
    if (req.user.role === "ngo" && city !== req.user.city) {
      return res.status(403).json({ message: "NGO can only add stock in their own city" });
    }

    const item = await Inventory.create({
      blood_group,
      units: Number(units),
      hospital_name:
        req.user.role === "hospital" ? req.user.full_name || hospital_name : hospital_name,
      city: req.user.role === "hospital" ? req.user.city || city : city,
      expiry_date,
      created_by: req.user.id,
    });
    res.status(201).json(serializeDoc(item));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Inventory item not found" });
    if (!canManageInventoryItem(req.user, item)) {
      return res.status(403).json({ message: "Not allowed to edit this stock" });
    }

    if (req.body.units !== undefined) item.units = Math.max(0, Number(req.body.units));
    if (req.body.hospital_name && req.user.role === "admin") {
      item.hospital_name = req.body.hospital_name;
    }
    if (req.body.city && (req.user.role === "admin" || req.user.role === "ngo")) {
      if (req.user.role === "ngo" && req.body.city !== req.user.city) {
        return res.status(403).json({ message: "NGO cannot move stock outside their city" });
      }
      item.city = req.body.city;
    }
    if (req.body.blood_group) item.blood_group = req.body.blood_group;
    if (req.body.expiry_date) item.expiry_date = req.body.expiry_date;

    await item.save();
    res.json(serializeDoc(item));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Inventory item not found" });
    if (!canManageInventoryItem(req.user, item)) {
      return res.status(403).json({ message: "Not allowed to delete this stock" });
    }
    await item.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
