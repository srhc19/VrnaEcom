const cartModel = require("../models/cart");
const Razorpay = require("razorpay");
const orderModel = require("../models/order");
const Product = require("../models/addproducts");

require("dotenv").config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

async function orderConfirmed(req, res) {
  const userId = req.session.user._id.toString();
  req.session.productId = null;
  req.session.couponCode = null;
  req.session.couponapplied = null;
  const usercart = await cartModel.deleteOne({ userId });
  res.render("orderConfirm");
}

async function paynow(req, res) {
  try {
    const orderId = req.session.orderid;
    const orderdetails = await orderModel.findOne({ orderId });

    let totalPrice = orderdetails.totalPrice;
    const hashedid = orderdetails._id;
    const options = {
      amount: totalPrice * 100,
      currency: "INR",
      receipt: hashedid,
      payment_capture: 1,
    };

    razorpay.orders.create(options, async function (err, order) {
      if (err) {
        res.status(500).send("An error occurred while creating the order");
        return;
      }

      res.render("razorpay-payment-page", { order });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
}

async function getrazorpayID(req, res) {
  try {
    const Payment_id = req.body.paymentId;

    const orderId = req.session.orderid;
    const order = await orderModel.findOne({ orderId });

    let productids = order.productsInfo.map((info) => {
      return info.productId;
    });

    for (const id of productids) {
      let product = await Product.findOne({ _id: id });
    }

    order.razorPayment_id = Payment_id;
    order.paymentMode = "Online Payment";
    order.razorpaymentStatus = "success";

    await order.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
}

async function razorrejection(req, res) {
  const error = req.body.error;
  const Payment_id = req.body.paymentID;

  const orderId = req.session.orderid;
  const order = await orderModel.findOne({ orderId });

  order.razorPayment_id = Payment_id;
  order.paymentMode = "Online Payment";
  order.razorpaymentStatus = "Failed";
  order.save();

  req.session.razorpayStatus = true;
  return res.status(200).json({ success: true });
}

function failedPayment(req, res) {
  try {
    res.render("failedPayment");
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
}

async function paymentSuccess(req, res) {
  const razorpayPaymentResponse = req.body;

  res.render("payment-success-page", {
    paymentResponse: razorpayPaymentResponse,
  });
}

module.exports = {
  orderConfirmed,
  paynow,
  getrazorpayID,
  razorrejection,
  failedPayment,
  paymentSuccess,
};
