const express = require("express");
const MonthlyDemand = require("../models/MonthlyDemand");
const Inventory = require("../models/Inventory");
const Request = require("../models/Request");
const { authenticate, authorize } = require("../middleware/auth");
const { serializeDoc, serializeMany } = require("../utils/serialize");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    let inventoryFilter = {};
    let requestFilter = { status: "pending" };

    if (req.user.role === "hospital") {
      inventoryFilter = {
        $or: [{ created_by: req.user.id }, { hospital_name: req.user.full_name }],
      };
      requestFilter = { ...requestFilter, $or: [{ created_by: req.user.id }, { city: req.user.city }] };
    } else if (req.user.role === "ngo" || req.user.role === "donor") {
      inventoryFilter = { city: req.user.city };
      requestFilter = { ...requestFilter, city: req.user.city };
    }

    const [demandRows, inventory, requests] = await Promise.all([
      MonthlyDemand.find({}).sort({ month_order: 1 }),
      Inventory.find(inventoryFilter),
      Request.find(requestFilter),
    ]);

    res.json({
      demandRows: serializeMany(demandRows),
      inventory: serializeMany(inventory),
      requests: serializeMany(requests),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/months", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const { month_label, actual_units, predicted_units } = req.body;
    if (!month_label || actual_units === undefined) {
      return res.status(400).json({ message: "Month label and actual units are required" });
    }
    const count = await MonthlyDemand.countDocuments();
    const row = await MonthlyDemand.create({
      month_label,
      month_order: count + 1,
      actual_units: Number(actual_units),
      predicted_units: Number(predicted_units || 0),
      created_by: req.user.id,
    });
    res.status(201).json(serializeDoc(row));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
