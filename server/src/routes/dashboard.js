const express = require("express");
const Inventory = require("../models/Inventory");
const Donor = require("../models/Donor");
const Request = require("../models/Request");
const { authenticate } = require("../middleware/auth");
const { serializeMany } = require("../utils/serialize");
const {
  inventoryReadFilter,
  donorReadFilter,
  requestReadFilter,
} = require("../utils/rbac");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const [inventory, donorsCount, requests] = await Promise.all([
      Inventory.find(inventoryReadFilter(req.user)).sort({ units: 1 }),
      Donor.countDocuments(donorReadFilter(req.user)),
      Request.find(requestReadFilter(req.user)).sort({ created_at: -1 }).limit(5),
    ]);

    res.json({
      inventory: serializeMany(inventory),
      donorsCount,
      requests: serializeMany(requests),
      roleScope: req.user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
