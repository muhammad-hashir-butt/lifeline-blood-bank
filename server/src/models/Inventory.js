const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    blood_group: { type: String, required: true },
    units: { type: Number, required: true, min: 0, default: 0 },
    hospital_name: { type: String, required: true },
    city: { type: String, required: true },
    expiry_date: { type: String, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Inventory", inventorySchema);
