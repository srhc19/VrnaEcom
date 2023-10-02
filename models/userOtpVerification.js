const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userOtpSchema = new Schema({
  userId: String,
  otp: {
    type: String,
    required: true,
  },
  createdAt: Date,
  expiredAt: Date,
});

module.exports = mongoose.model("userOtpVerification", userOtpSchema);
