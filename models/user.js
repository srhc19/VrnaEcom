const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contactnumber: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: Boolean,
  isBlocked: Boolean,
  verified: Boolean,
  // otp: String,
  otp: {
    code: String, // Include the OTP code
    expiresAt: Date, // Include the expiration time
  },
});

module.exports = mongoose.model("User", userSchema);
