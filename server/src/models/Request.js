const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    hospital_name: { type: String, required: true },
    city: { type: String, required: true },
    blood_group: { type: String, required: true },
    units: { type: Number, required: true, min: 1 },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "high",
    },
    status: {
      type: String,
      enum: ["pending", "matched", "fulfilled", "cancelled"],
      default: "pending",
    },
    matched_source: { type: String, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Request", requestSchema);
