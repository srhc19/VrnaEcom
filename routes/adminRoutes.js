const express = require("express");
const router = express.Router();
const userController = require("../controllers/usercontrollers");
const adminController = require("../controllers/adminController");
const Product = require("../models/addproducts");
const UserModel = require("../models/user");
const OrderModel = require("../models/order");
const category = require("../models/category");
const couponsModel = require("../models/coupons");
const order = require("../models/order");

router.get(
  "/",
  adminController.checkAdminAuthenticated,
  userController.displayAdminPage
);
router.post(
  "/delete/:userId",
  adminController.checkAdminAuthenticated,
  adminController.adminDeleteUser
);

router.post(
  "/add",
  adminController.checkAdminAuthenticated,
  adminController.adminAddUser
);

router.post(
  "/update/:userId",
  adminController.checkAdminAuthenticated,
  adminController.adminUpdateUser
);

router.get(
  "/add-product",
  adminController.checkAdminAuthenticated,
  adminController.addProducts
);

router.post(
  "/add-product",
  adminController.checkAdminAuthenticated,
  adminController.upload.array("images[]", 10),
  adminController.postAddProducts
);

router.get(
  "/adminproduct",
  adminController.checkAdminAuthenticated,
  adminController.adminProduct
);
router.get("/product/:productId", userController.productdetails);

// admin products
router.post(
  "/adminProducts/logout",

  adminController.adminLogOut
);

router.get("/update/:id", adminController.updateProduct);

router.post(
  "/updateProduct/:id",
  adminController.upload.array("images[]", 10),
  adminController.postUpdateProduct
);

router.get("/update/removeimg/:index", adminController.updateremoveimg);

router.post(
  "/adminProducts/delete/:productId",
  adminController.adminDeleteProducts
);
router.get(
  "/adminCategories",

  adminController.checkAdminAuthenticated,
  adminController.adminCategories
);
router.post(
  "/addCategories",
  adminController.checkAdminAuthenticated,
  adminController.postAdminCategories
);
router.post(
  "/adminCategories/delete/:categoryId",
  adminController.adminDeleteCategories
);

router.post(
  "/adminCategories/update/:categoryId",
  adminController.adminUpdateCategories
);
// categories logout
router.post(
  "/adminCategories/logout",
  adminController.checkAdminAuthenticated,
  adminController.adminLogOut
);
router.get("/searchCategory", adminController.searchCategory);
router.get("/searchorder", adminController.searchorder);

router.get("/search", adminController.search);

router.post("/blockUser/:userId", adminController.blockUser);

router.get(
  "/adminOrderdetails",
  adminController.checkAdminAuthenticated,
  adminController.adminOrderdetails
);

router.get(
  "/adminCoupons",
  adminController.checkAdminAuthenticated,
  async (req, res) => {
    try {
      const coupons = await couponsModel.find();

      res.render("adminCoupons", { coupons, currentPage: 1, totalPages: 2 });
    } catch (error) {
      res.status(400).json({ error: "server error" });
    }
  }
);

router.post("/deleteCoupon/:couponId", async (req, res) => {
  try {
    const couponid = req.params.couponId;
    await couponsModel.findByIdAndDelete({ _id: couponid });
    res.redirect("/admin/adminCoupons");
  } catch (error) {
    res.status(400).json({ error: "Server Error" });
  }
});

router.post("/updateCoupon/:couponId", async (req, res) => {
  try {
    const couponid = req.params.couponId;
    const { min, max, Discount } = req.body;

    console.log(min, max, Discount);
    const coupon = await couponsModel.findByIdAndUpdate(
      { _id: couponid },
      { min, max, Discount }
    );

    res.redirect("/admin/adminCoupons");
  } catch (error) {
    res.status(400).json({ error: "Server Error" });
  }
});

router.post("/AddCoupon", async (req, res) => {
  try {
    const { couponname, minmum, maximum, Discountpercentage } = req.body;
    console.log(req.body);
    let coupon = await couponsModel.findOne({ couponcode: couponname });
    if (coupon) {
      res.redirect("/admin/adminCoupons");
    } else {
      coupon = new couponsModel({
        couponCode: couponname,
        min: minmum,
        max: maximum,
        Discount: Discountpercentage,
      });
      console.log(coupon, "hhrhehjdfjrjjgjh");
      await coupon.save();
      res.redirect("/admin/adminCoupons");
    }
  } catch (error) {
    res.status(400).json({ error: "Server Error" });
  }
});

router.post("/updateOrderStatus", async (req, res) => {
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
});

router.get("/adminOrderManagement", async (req, res) => {
  try {
    ITEMS_PER_PAGE = 6;
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
});

router.post("/adminupdateReturnStatus", async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;
    if (
      newStatus === "Applied For Return" ||
      newStatus === "Accepted" ||
      newStatus === "Rejected"
    ) {
      const order = await OrderModel.findOne({ _id: orderId });
      order.OrderedState = newStatus;
      order.save();

      return res.status(200).json({ message: "success", newStatus, orderId });
    }
    res.send({ message: "success" });
  } catch (error) {
    req.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
