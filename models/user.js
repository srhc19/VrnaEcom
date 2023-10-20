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
  forgotpswcode: {
    code: String,
    expiresAt: Date,
  },
  address: [
    {
      addressCountry: {
        type: String,
        default: "India",
      },
      addressState: {
        type: String,
        default: "Kerela",
      },
      postalCode: {
        type: Number,
        default: 686638,
      },
      addressCity: {
        type: String,
        default: "Kochi",
      },
      addressLocality: {
        type: String,
        default: "Maradu",
      },
      houseaddress: {
        type: String,
        default: "123 Random Street",
      },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
