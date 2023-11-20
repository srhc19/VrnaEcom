const whishmodel = require("../models/whishlist");
const crypto = require("crypto");
const Product = require("../models/addproducts");

async function wishlist(req, res) {
  try {
    const user_id = req.session.user._id;

    const whishlist = await whishmodel.findOne({ userId: user_id });

    if (!whishlist) {
      console.log("not found");
      return res.status(404).json({ error: "whishlist not found" });
    }
    function generateRandomString(length) {
      const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
      return randomBytes.toString("hex").slice(0, length);
    }

    const randomString = generateRandomString(10);

    const productIds = whishlist.productsInfo.map((info) => info.productId);

    if (!productIds || productIds.length === 0) {
      return res.status(500).json({ message: " Error" });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    res.render("whishlist", { products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

async function addproduct_whistlist(req, res) {
  try {
    const { productid } = req.body;

    const product = await Product.findOne({ _id: productid });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const user_id = req.session.user._id.toString();
    const user = await whishmodel.findOne({ userId: user_id });

    if (!user) {
      const newUser = new whishmodel({
        userId: user_id,
        productsInfo: [{ productId: productid }],
      });

      await newUser.save();
    } else {
      user.productsInfo.push({ productId: productid });
      await user.save();
    }

    res.status(200).json({ message: "success", productid });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function whishliststyle(req, res) {
  try {
    const user_id = req.session.user._id.toString();

    const whishlist = await whishmodel.findOne({ userId: user_id });

    const productIds = whishlist.productsInfo.map((info) => info.productId);
    res.status(200).json({ productIds });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function removeproduct_whistlist(req, res) {
  try {
    const { productid } = req.body;

    const product = await Product.findOne({ _id: productid });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const user_id = req.session.user._id.toString();
    const user = await whishmodel.findOne({ userId: user_id });

    if (!user) {
      return res.status(200).json({ message: "error", productid });
    }
    user.productsInfo = user.productsInfo.filter(
      (info) => info.productId.toString() !== productid
    );

    await user.save();

    res.status(200).json({ message: "success", productid });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

module.exports = {
  wishlist,
  addproduct_whistlist,
  whishliststyle,
  removeproduct_whistlist,
};
