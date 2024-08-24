const express = require("express");
const router = express.Router();

const userController = require("../controllers/usercontrollers");
const adminController = require("../controllers/adminController");
const offerController = require("../controllers/offerController");
const orderController = require("../controllers/orderController");

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
// router.get("/product/:productId", userController.productdetails);

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
  offerController.adminCoupons
);

router.post(
  "/deleteCoupon/:couponId",
  adminController.checkAdminAuthenticated,
  offerController.deleteCoupon
);

router.post(
  "/updateCoupon/:couponId",
  adminController.checkAdminAuthenticated,
  offerController.updateCoupon
);

router.post(
  "/AddCoupon",
  adminController.checkAdminAuthenticated,
  offerController.AddCoupon
);

router.post(
  "/updateOrderStatus",
  adminController.checkAdminAuthenticated,
  orderController.updateOrderStatus
);

router.get(
  "/adminOrderManagement",
  adminController.checkAdminAuthenticated,
  orderController.adminOrderManagement
);

router.post(
  "/adminupdateReturnStatus",
  adminController.checkAdminAuthenticated,
  orderController.adminupdateReturnStatus
);
router.get(
  "/dashboard",
  adminController.checkAdminAuthenticated,
  adminController.dashboard
);
router.post("/createSalesReport", orderController.salesReport);
router.get("/orders-chart", orderController.orders_chart);

module.exports = router;
