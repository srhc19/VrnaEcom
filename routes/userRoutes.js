const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const userController = require("../controllers/usercontrollers");
const cartModel = require("../models/cart");
const Product = require("../models/addproducts");
const UserModel = require("../models/user");
const orderModel = require("../models/order");
const paymentController = require("../controllers/paymentController");
const ITEMS_PER_PAGE = 8;
const couponsModel = require("../models/coupons");
// const { default: orders } = require("razorpay/dist/types/orders");

router.get("/userprofile", userController.userProfile);

router.get("/login", userController.loginPage);

router.post("/login", userController.postLoginPage);

router.post("/logout", userController.postLogOut);

router.get(
  "/register",
  userController.checkNotAuthenticated,
  userController.displayRegister
);
router.post(
  "/register",
  userController.checkNotAuthenticated,
  userController.postRegister
);

router.get(
  "/",
  userController.checkAuthenticated,
  userController.checkBlocked,
  userController.displayMainPage
);
router.delete("/logout", userController.userLogOut);

router.get("/forgotpaswordemail", userController.displayForgotPasswordEmail);

router.post("/forgotpaswordemail", userController.postForgotpassword);

router.get("/createnewpassword", userController.displayCreateNewPassword);

router.post("/createnewpassword", userController.postdisplayCreateNewPassword);

router.get(
  "/addTOCartBtn/:productId",
  userController.checkBlocked,
  userController.addToCartBtn
);

router.get("/usercart", userController.checkBlocked, userController.usercart);

router.get(
  "/userCart/delete/:productId",
  userController.checkBlocked,
  userController.cartDeleteProduct
);
router.post(
  "/update-product-count/:productId",
  userController.checkBlocked,
  userController.updateProductCount
);

router.get("/checkout", userController.checkBlocked, userController.checkout);

router.get(
  "/checkout/:productId",
  userController.checkBlocked,
  userController.checkoutProductDetails
);

router.get(
  "/paymentSelection",
  userController.checkorderCanceled,
  userController.checkBlocked,
  userController.paymentSelection
);

router.get(
  "/orderConfirmed",
  userController.checkorderCanceled,
  userController.checkBlocked,
  paymentController.orderConfirmed
);
router.get(
  "/editAddress",
  userController.checkBlocked,
  userController.editAddress
);
router.post(
  "/updateAddress",
  userController.checkBlocked,
  userController.updateAddress
);

// Handle deleting an address
router.post(
  "/deleteAddress",
  userController.checkBlocked,
  userController.deleteAddress
);

router.get(
  "/registerresendOtp",
  userController.checkBlocked,
  userController.registerresendotp
);

router.get(
  "/forgotpswresendotp",
  userController.checkBlocked,
  userController.forgotpswresendotp
);

router.get("/cancelOrder", userController.cancelOrder);

router.get(
  "/paynow",
  userController.checkorderCanceled,
  paymentController.paynow
);

router.post("/user/paymentSuccess", async (req, res) => {
  const razorpayPaymentResponse = req.body;

  res.render("payment-success-page", {
    paymentResponse: razorpayPaymentResponse,
  });
});

router.post("/getrazorpayID", async (req, res) => {
  const Payment_id = req.body.paymentId;

  const orderId = req.session.orderid;
  const order = await orderModel.findOne({ orderId });

  order.razorPayment_id = Payment_id;
  order.paymentMode = "Online Payment";
  order.razorpaymentStatus = "success";

  order.save();
  return res.status(200).json({ success: true });
});

router.post("/razorrejection", async (req, res) => {
  const error = req.body.error;
  const Payment_id = req.body.paymentID;

  const orderId = req.session.orderid;
  const order = await orderModel.findOne({ orderId });
  console.log(order);

  order.razorPayment_id = Payment_id;
  order.paymentMode = "Online Payment";
  order.razorpaymentStatus = "Failed";
  order.save();

  req.session.razorpayStatus = true;
  return res.status(200).json({ success: true });
});

router.get("/failedPayment", userController.checkorderCanceled, (req, res) => {
  res.render("failedPayment");
});

router.get("/mainproductSearch", async (req, res) => {
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
});

router.get("/list", async (req, res) => {
  try {
    const products = await Product.find();
    if (!products) {
    }
    res.render("whistlist", { products });
  } catch (error) {}
});

router.post("/storeTotalPrice", async (req, res) => {
  try {
    const { Price } = req.body;
    const orderId = req.session.orderid;

    const order = await orderModel.findOneAndUpdate(
      { orderId },
      {
        totalPrice: req.session.coupondiscountedPrice || Price,
      }
    );

    req.session.coupondiscountedPrice = null;
    res.status(200).json({ message: "Total price updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/updateTotalPrice", async (req, res) => {
  try {
    const { Price, originalTotalPrice } = req.body;
    const orderId = req.session.orderid;
    req.session.originalTotalPrice = originalTotalPrice;
    const order = await orderModel.findOneAndUpdate(
      { orderId },
      {
        totalPrice: Price,
      }
    );
    req.session.coupondiscountedPrice = Price;

    res.status(200).json({
      message: "Total price updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/findCoupon", async (req, res) => {
  try {
    const enteredCouponCode = req.body.enteredCouponCode;

    const coupon = await couponsModel.findOne({
      couponCode: enteredCouponCode,
    });

    if (!coupon) {
      return res.status(400).json({
        message: "Invalid Coupon",
      });
    }

    if (req.session.couponCode) {
      if (req.session.couponCode === enteredCouponCode) {
        return res.status(400).json({
          message: "Coupon Already Applied",
        });
      }
    }
    if (req.session.couponapplied) {
      return res.status(400).json({
        message: "you can only use one coupon per order",
      });
    }

    const discount = coupon.Discount;
    req.session.couponCode = enteredCouponCode;
    req.session.couponapplied = true;
    res.status(200).json({
      discount,
    });
  } catch (error) {
    res.status(500).json({ Error: "Server Error" });
  }
});

router.post("/changeCouponCode", async (req, res) => {
  try {
    const { code } = req.body;
    const originalPrice = req.session.originalTotalPrice;

    req.session.couponapplied = false;
    req.session.couponCode = null;
    req.session.originalTotalPrice = null;
    res.status(200).json({ originalPrice });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
});

router.get("/userOrderDetails", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const userId = req.session.user._id.toString();

    const orders = await orderModel
      .find({ userId })
      .skip(skip)
      .limit(ITEMS_PER_PAGE);
    const updatedOrders = orders.map((order) => {
      const dateString = order.Date.toString();
      const dateObj = new Date(dateString);
      const date = dateObj.toISOString().slice(0, 10);
      const options = { weekday: "long" };
      const dayOfWeek = new Intl.DateTimeFormat("en-US", options).format(
        dateObj
      );
      return { ...order._doc, Date: `${date} ${dayOfWeek}` };
    });

    const totalProductCount = await orderModel
      .find({ userId })
      .countDocuments();
    const totalPages = Math.ceil(totalProductCount / ITEMS_PER_PAGE);
    const number = (page - 1) * ITEMS_PER_PAGE + 1;
    res.render("userOrderDetails", {
      orders: updatedOrders,
      currentPage: page,
      totalPages,
      number,
    });
  } catch (error) {
    res.status(500).status({ error: "server Error" });
  }
});

router.get("/userorderCancel/:orderId", async (req, res) => {
  try {
    const order_id = req.params.orderId;
    const order = await orderModel.findOne({
      _id: order_id,
    });

    if (
      order.OrderedState !== "delivered" &&
      order.OrderedState !== "Issued For Return"
    ) {
      order.OrderedState = "canceled";
      await order.save();
      return res.send({ message: "canceled", order_id });
    }
  } catch (error) {
    res.status(500).status({ error: "server Error" });
  }
});

router.get("/userorderReturn/:userId", async (req, res) => {
  try {
    const user_id = req.params.userId.toString();

    const orders = await orderModel.find({
      userId: user_id,
      OrderedState: "delivered",
    });

    let newordersArray = [];

    orders.forEach((order) => {
      const providedDate = new Date(order.Date.toString());
      const currentDate = Date.now();
      const timeDifference = currentDate - providedDate;

      const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

      if (daysDifference < 10) {
        newordersArray.push(order._id);
      }
    });
    res.send({ message: "success", newordersArray });
  } catch (error) {
    res.status(500).status({ error: "server Error" });
  }
});

router.post("/userReturnProduct/:orderId", async (req, res) => {
  try {
    const { inputValue } = req.body;
    const order_id = req.params.orderId;
    const order = await orderModel.findOne({
      _id: order_id,
    });

    if (order.OrderedState === "delivered") {
      order.OrderedState = "Applied For Return";
      order.returnReason = inputValue;
      await order.save();
      return res.status(200).json({ message: "Issued For Return", order_id });
    } else {
      return res.status(500).json({ message: "Error in returning product" });
    }
  } catch (error) {
    res.status(500).status({ error: "server Error" });
  }
});

router.get(
  "/hoodies",
  userController.checkAuthenticated,
  userController.checkBlocked,
  async (req, res) => {
    try {
      const products = await Product.find({ productCategory: "Hoodie" });
      if (!products) {
        res.status(500).status({ error: "products  not found" });
      }
      let cartProductCount = 0;
      const userId = req.session.user._id.toString();
      const cart = await cartModel.findOne({ userId: userId });
      if (cart) {
        cartProductCount = cart.productsInfo.length;
      }
      res.render("hoodies", { products, cartProductCount });
    } catch (error) {
      res.status(500).status({ error: "server Error" });
    }
  }
);

router.get(
  "/tshirts",
  userController.checkAuthenticated,
  userController.checkBlocked,
  async (req, res) => {
    try {
      const products = await Product.find({ productCategory: "T-Shirt" });
      if (!products) {
        res.status(500).status({ error: "products  not found" });
      }
      let cartProductCount = 0;
      const userId = req.session.user._id.toString();
      const cart = await cartModel.findOne({ userId: userId });
      if (cart) {
        cartProductCount = cart.productsInfo.length;
      }

      res.render("tshirts", { products, cartProductCount });
    } catch (error) {
      res.status(500).status({ error: "server Error" });
    }
  }
);

module.exports = router;
