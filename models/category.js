const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  categoryName: {
    type: String,
    required: true,
  },
  isActive: {
    type: String,
    required: true,
  },
  discountpercentage: Number,
});

module.exports = mongoose.model("category", categorySchema);
