const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  userName: String,
  productsInfo: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product", // Replace with the actual model name for products
        required: true,
      },
      count: Number,
      productName: String,
    },
  ],
  Date: {
    type: Date,
    required: true,
  },

  OrderedState: {
    type: String,
    default: "pending",
  },
  orderId: String,
  paymentMode: {
    type: String,
    default: "Online Payment",
  },
  totalPrice: Number,
  razorPayment_id: String,
  razorpaymentStatus: String,
  returnReason: String,
  paymentStatus: String,
});

module.exports = mongoose.model("order", orderSchema);
