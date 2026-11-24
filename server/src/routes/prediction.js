const express = require("express");
const MonthlyDemand = require("../models/MonthlyDemand");
const Inventory = require("../models/Inventory");
const Request = require("../models/Request");
const { authenticate, authorize } = require("../middleware/auth");
const { serializeDoc, serializeMany } = require("../utils/serialize");
const { inventoryReadFilter, requestReadFilter } = require("../utils/rbac");

const router = express.Router();

router.get("/", authenticate, authorize("admin", "hospital", "ngo"), async (req, res) => {
  try {
    const pendingFilter = {
      ...requestReadFilter(req.user),
      status: "pending",
    };

    const [demandRows, inventory, requests] = await Promise.all([
      MonthlyDemand.find({}).sort({ month_order: 1 }),
      Inventory.find(inventoryReadFilter(req.user)),
      Request.find(pendingFilter),
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
