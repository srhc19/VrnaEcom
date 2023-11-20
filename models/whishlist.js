const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const whishSchema = new Schema({
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
    },
  ],
});

module.exports = mongoose.model("whishlist", whishSchema);
