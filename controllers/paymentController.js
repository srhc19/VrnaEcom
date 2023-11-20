const cartModel = require("../models/cart");
const Razorpay = require("razorpay");
const orderModel = require("../models/order");
const RAZORPAY_ID_KEY = "rzp_test_bMgPK2HOIcHObe";
RAZORPAY_SECRET_KEY = "00z3sy0mYQ3w930Ry1o4A6Oz";
const razorpay = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
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
    console.log(orderdetails.totalPrice);
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
        console.error(err);

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

module.exports = { orderConfirmed, paynow };
