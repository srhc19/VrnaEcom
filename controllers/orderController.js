const orderModel = require("../models/order");
const Product = require("../models/addproducts");
const UserModel = require("../models/user");
const user = require("../models/user");
const OrderModel = require("../models/order");

const path = require("path");
const ejs = require("ejs");

const Chart = require("chart.js");

//invoice
const puppeteer = require("puppeteer");
const ITEMS_PER_PAGE = 8;

async function userOrderDetails(req, res) {
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
}

async function userorderCancel(req, res) {
  try {
    const order_id = req.params.orderId;
    const order = await orderModel.findOne({
      _id: order_id,
    });

    if (
      order.OrderedState !== "delivered" &&
      order.OrderedState !== "Applied For Return" &&
      order.OrderedState !== "Accepted" &&
      order.OrderedState !== "Rejected"
    ) {
      order.OrderedState = "cancelled";
      await order.save();
      return res.send({ message: "cancelled", order_id });
    }
  } catch (error) {
    res.status(500).status({ error: "server Error" });
  }
}

async function userorderReturn(req, res) {
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
}

async function userReturnProduct(req, res) {
  try {
    const { reason } = req.body;
    const order_id = req.params.orderId;
    const order = await orderModel.findOne({
      _id: order_id,
    });

    if (order.OrderedState === "delivered") {
      order.OrderedState = "Applied For Return";
      order.returnReason = reason;
      await order.save();
      return res.status(200).json({ message: "Issued For Return", order_id });
    } else {
      return res.status(500).json({ message: "Error in returning product" });
    }
  } catch (error) {
    res.status(500).status({ error: "server Error" });
  }
}

async function orderdetailsfinal(req, res) {
  try {
    const orderId = req.session.orderid;
    const order = await orderModel.findOne({ orderId });

    let productids = order.productsInfo.map((info) => {
      return info.productId;
    });
    let productprices = [];
    for (const id of productids) {
      let product = await Product.findOne({ _id: id });
      productprices.push(product.productPrice);
    }

    res.render("orderdetailsfinal.ejs", { order, productprices });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function orderdetails(req, res) {
  try {
    const orderId = req.params.orderId;

    const order = await orderModel.findOne({ _id: orderId });

    let productids = order.productsInfo.map((info) => {
      return info.productId;
    });
    order.productprices = [];
    for (const id of productids) {
      let product = await Product.findOne({ _id: id });
      order.productprices.push(product.productPrice);
    }

    res.render("orderdetailsfinal.ejs", { order });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function storeTotalPrice(req, res) {
  try {
    const {
      Price,
      firstname,
      lastname,
      address,
      pinCode,
      contactNum,
      walletApplied,
      wallet_amount,
    } = req.body;
    const orderId = req.session.orderid;
    const order = await orderModel.findOne({ orderId });

    if (walletApplied) {
      const user = await UserModel.findOne({ _id: order.userId });

      user.wallet.push({
        amount: Number(-wallet_amount),
        walletdate: Date.now(),
        orderid: order._id,
      });

      await user.save();
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.totalPrice = req.session.coupondiscountedPrice || Price;
    order.addressdetails.address = address;
    order.addressdetails.postalCode = pinCode;
    order.addressdetails.contactNumber = contactNum;
    order.addressdetails.firstName = firstname;
    order.addressdetails.lastName = lastname;

    await order.save();

    req.session.coupondiscountedPrice = null;
    res.status(200).json({ message: "Total price updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Error" });
  }
}

async function functionupdateTotalPrice(req, res) {
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
}

async function invoice(req, res) {
  try {
    const orderId = req.params.id;

    const order = await orderModel.findOne({ _id: orderId });

    ejs.renderFile(
      path.join(
        "C:\\Users\\Sarath\\Documents\\brototype\\week9\\Vrna",
        "views",
        "invoice.ejs"
      ),
      { order },
      (err, htmlContent) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error rendering the PDF");
        }

        (async () => {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(htmlContent);

          const pdfPath = path.join(
            "C:\\Users\\Sarath\\Documents\\brototype\\week9\\Vrna",
            "public",
            `_order.pdf`
          );

          await page.pdf({ path: pdfPath, format: "A4" });

          await browser.close();

          res.setHeader(
            "Content-Disposition",
            `attachment; filename=_order.pdf`
          );
          res.setHeader("Content-Type", "application/pdf");
          res.sendFile(pdfPath);
        })();
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate the invoice.");
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { orderId, newStatus } = req.body;
    console.log(orderId, newStatus);
    if (newStatus !== "canceled") {
      const order = await OrderModel.findOne({ _id: orderId });
      order.OrderedState = newStatus;
      order.save();

      return res.status(200).json({ message: "success", newStatus, orderId });
    }
  } catch (error) {
    res.status(500).json({ message: "server Error" });
  }
}

async function adminOrderManagement(req, res) {
  try {
    let ITEMS_PER_PAGE = 6;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const orders = await OrderModel.find({
      OrderedState: { $in: ["Applied For Return", "Accepted", "Rejected"] },
    })
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    const totalProductCount = await OrderModel.find({
      OrderedState: { $in: ["Applied For Return", "Accepted", "Rejected"] },
    }).countDocuments();
    const totalPages = Math.ceil(totalProductCount / ITEMS_PER_PAGE);
    const number = (page - 1) * ITEMS_PER_PAGE + 1;
    res.render("adminOrderManagement", {
      orders,
      number,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "server Error" });
  }
}

async function adminupdateReturnStatus(req, res) {
  try {
    const { orderId, newStatus } = req.body;
    if (
      newStatus === "Applied For Return" ||
      newStatus === "Accepted" ||
      newStatus === "Rejected"
    ) {
      const order = await OrderModel.findOne({ _id: orderId });
      if (newStatus === "Accepted") {
        const user = await UserModel.findOne({ _id: order.userId });

        if (!user.wallet) {
          user.wallet = [];
        }

        let date = Date.now();

        const newAmount = order.totalPrice;

        user.wallet.push({
          amount: newAmount,
          walletdate: date,
        });

        await user.save();
      }

      order.OrderedState = newStatus;
      await order.save();

      return res.status(200).json({ message: "success", newStatus, orderId });
    }
    res.send({ message: "success" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function orders_chart(req, res) {
  try {
    const orders = await OrderModel.find({}, "Date totalPrice");

    const dates = orders.map((order) => order.Date.toISOString().split("T")[0]);
    const totalPrices = orders.map((order) => order.totalPrice);

    res.json({ dates, totalPrices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function salesReport(req, res) {
  try {
    const { start_date, end_date } = req.body;
    const today = Date.now();
    if (
      new Date(start_date) > new Date(end_date) ||
      new Date(end_date) > today
    ) {
      return res.redirect("/admin/dashboard");
    }

    console.log("Start Date:", start_date);
    console.log("End Date:", end_date);

    const orders = await orderModel.find({
      Date: {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      },
    });
    let totalOrders = await orderModel
      .find({
        Date: {
          $gte: new Date(start_date),
          $lte: new Date(end_date),
        },
      })
      .countDocuments();
    let totalsales = 0;
    orders.forEach((order) => {
      totalsales += order.totalPrice;
    });

    let orderCanceled = 0;
    orders.forEach((order) => {
      if (order.OrderedState === "cancelled") {
        orderCanceled++;
      }
    });
    let orderdelivered = 0;
    orders.forEach((order) => {
      if (order.OrderedState === "delivered") {
        orderdelivered++;
      }
    });
    let orderReturned = 0;
    orders.forEach((order) => {
      if (order.OrderedState === "Accepted") {
        orderReturned++;
      }
    });
    res.render("salesReport", {
      totalsales,
      totalOrders,
      orderCanceled,
      orderdelivered,
      orderReturned,
    });
  } catch (error) {
    res.status(500).json({ message: " server error" });
  }
}
module.exports = {
  userOrderDetails,
  userorderCancel,
  userorderReturn,
  userReturnProduct,
  orderdetailsfinal,
  orderdetails,
  storeTotalPrice,
  functionupdateTotalPrice,
  invoice,
  updateOrderStatus,
  adminOrderManagement,
  adminupdateReturnStatus,
  orders_chart,
  salesReport,
};
