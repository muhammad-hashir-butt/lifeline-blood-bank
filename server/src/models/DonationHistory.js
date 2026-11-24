const mongoose = require("mongoose");

const donationHistorySchema = new mongoose.Schema(
  {
    donor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
    hospital_name: { type: String, required: true },
    blood_group: { type: String, required: true },
    units: { type: Number, default: 1 },
    donated_at: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("DonationHistory", donationHistorySchema);
