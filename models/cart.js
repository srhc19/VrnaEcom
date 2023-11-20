const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  productsInfo: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      isOrdered: {
        type: Boolean,
        default: false,
      },
      count: Number,
      productPrice: Number,
    },
  ],
});

module.exports = mongoose.model("cart", cartSchema);
