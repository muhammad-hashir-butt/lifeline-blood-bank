const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    blood_group: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    last_donation_date: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Donor", donorSchema);
