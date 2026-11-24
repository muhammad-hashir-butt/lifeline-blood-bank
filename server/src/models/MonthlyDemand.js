const mongoose = require("mongoose");

const monthlyDemandSchema = new mongoose.Schema(
  {
    month_label: { type: String, required: true },
    month_order: { type: Number, required: true },
    actual_units: { type: Number, required: true },
    predicted_units: { type: Number, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("MonthlyDemand", monthlyDemandSchema);
