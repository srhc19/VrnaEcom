const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponsSchema = new Schema({
  couponCode: {
    type: String,
    require: true,
  },
  min: {
    type: Number,
    require: true,
  },
  max: {
    type: Number,
    require: true,
  },
  ExpiryDate: {
    type: Date,
    require: true,
  },
  Discount: {
    type: Number,
    require: true,
  },
});

module.exports = mongoose.model("coupons", couponsSchema);
