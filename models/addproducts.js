const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  productCategory: {
    type: String,
    required: true,
  },
  productPrice: {
    type: Number,
    required: true,
  },
  productStock: {
    type: Number,
    required: true,
  },
  productImages: {
    type: [String],
  },
  count: Number,
  totalProductCount: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("addproducts", productSchema);
