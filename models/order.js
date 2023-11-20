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
  totalPrice: {
    type: Number,
  },
  razorPayment_id: {
    type: String,
  },
  razorpaymentStatus: {
    type: String,
  },
  returnReason: {
    type: String,
  },
  paymentStatus: {
    type: String,
  },
  addressdetails: {
    address: {
      type: String,
      default: "",
    },

    postalCode: {
      type: Number,
      default: 686638,
    },
    contactNumber: {
      type: Number,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
  },
});

module.exports = mongoose.model("order", orderSchema);
