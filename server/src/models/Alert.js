const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", default: null },
    recipient_name: { type: String, required: true },
    recipient_phone: { type: String, default: "" },
    recipient_email: { type: String, default: "" },
    city: { type: String, default: "" },
    blood_group: { type: String, default: "" },
    message: { type: String, required: true },
    channel: { type: String, default: "email" },
    status: { type: String, default: "sent" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Alert", alertSchema);
