const Product = require("../models/addproducts");
const cartModel = require("../models/category");

async function Hoodie(req, res) {
  try {
    let ITEMS_ = 5;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_;

    const products = await Product.find({
      productCategory: "Hoodie",
      productStock: { $gt: 0 },
    })
      .skip(skip)
      .limit(ITEMS_);
    if (!products) {
      res.status(500).status({ error: "products  not found" });
    }

    const totalProductsCount = await Product.find({
      productCategory: "Hoodie",
      productStock: { $gt: 0 },
    }).countDocuments();

    let cartProductCount = 0;
    const userId = req.session.user._id.toString();
    const cart = await cartModel.findOne({ userId: userId });
    if (cart) {
      cartProductCount = cart.productsInfo.length;
    }

    const totalPages = Math.ceil(totalProductsCount / ITEMS_);

    res.render("hoodies", {
      products,
      cartProductCount,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}

async function Hoodie_pagination(req, res) {
  try {
    let ITEMS_ = 5;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_;

    const products = await Product.find({
      productCategory: "Hoodie",
      productStock: { $gt: 0 },
    })
      .skip(skip)
      .limit(ITEMS_);
    if (!products) {
      res.status(500).status({ error: "products  not found" });
    }

    const totalProductsCount = await Product.find({
      productCategory: "Hoodie",
      productStock: { $gt: 0 },
    }).countDocuments();

    let cartProductCount = 0;
    const userId = req.session.user._id.toString();
    const cart = await cartModel.findOne({ userId: userId });
    if (cart) {
      cartProductCount = cart.productsInfo.length;
    }

    const totalPages = Math.ceil(totalProductsCount / ITEMS_);

    res.send({
      products,
      cartProductCount,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}

async function T_Shirt(req, res) {
  try {
    let ITEMS_ = 5;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_;

    const products = await Product.find({
      productCategory: "T-Shirt",
      productStock: { $gt: 0 },
    })
      .skip(skip)
      .limit(ITEMS_);
    if (!products) {
      res.status(500).status({ error: "products  not found" });
    }

    const totalProductsCount = await Product.find({
      productCategory: "T-Shirt",
      productStock: { $gt: 0 },
    }).countDocuments();

    let cartProductCount = 0;
    const userId = req.session.user._id.toString();
    const cart = await cartModel.findOne({ userId: userId });
    if (cart) {
      cartProductCount = cart.productsInfo.length;
    }

    const totalPages = Math.ceil(totalProductsCount / ITEMS_);

    res.render("tshirts", {
      products,
      cartProductCount,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}

async function tShirt_pagination(req, res) {
  try {
    let ITEMS_ = 5;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_;

    const products = await Product.find({
      productCategory: "T-Shirt",
      productStock: { $gt: 0 },
    })
      .skip(skip)
      .limit(ITEMS_);
    if (!products) {
      res.status(500).json({ error: "products  not found" });
    }

    const totalProductsCount = await Product.find({
      productCategory: "T-Shirt",
      productStock: { $gt: 0 },
    }).countDocuments();

    let cartProductCount = 0;
    const userId = req.session.user._id.toString();
    const cart = await cartModel.findOne({ userId: userId });
    if (cart) {
      cartProductCount = cart.productsInfo.length;
    }

    const totalPages = Math.ceil(totalProductsCount / ITEMS_);

    res.send({
      products,
      cartProductCount,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}

async function main_page_pagination(req, res) {
  try {
    let ITEMS_ = 8;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_;

    const products = await Product.find({ productStock: { $gt: 0 } })
      .skip(skip)
      .limit(ITEMS_);
    if (!products) {
      res.status(500).status({ error: "products  not found" });
    }

    const totalProductsCount = await Product.find({
      productStock: { $gt: 0 },
    }).countDocuments();

    let cartProductCount = 0;
    const userId = req.session.user._id.toString();
    const cart = await cartModel.findOne({ userId: userId });
    if (cart) {
      cartProductCount = cart.productsInfo.length;
    }

    const totalPages = Math.ceil(totalProductsCount / ITEMS_);

    res.send({
      products,
      cartProductCount,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}

async function mainproductSearch(req, res) {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: "Invalid search query" });
    }

    const searchResult = await Product.find({
      $or: [
        {
          productName: {
            $regex: new RegExp(query, "i"),
          },
        },
        {
          productCategory: {
            $regex: new RegExp(query, "i"),
          },
        },
      ],
    }).limit(5);

    res.json({
      results: searchResult,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server",
    });
  }
}
module.exports = {
  Hoodie,
  Hoodie_pagination,
  T_Shirt,
  tShirt_pagination,
  main_page_pagination,
  mainproductSearch,
};
