const express = require("express");
const router = express.Router();
const userController = require("../controllers/usercontrollers");
const adminController = require("../controllers/adminController");
const Product = require("../models/addproducts");
const UserModel = require("../models/user");
const OrderModel = require("../models/order");

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

// admin products logout
router.post(
  "/adminProducts/logout",

  adminController.adminLogOut
);

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

router.get("/search", adminController.search);
router.post("/blockUser/:userId", adminController.blockUser);

router.get(
  "/adminOrderdetails",
  adminController.checkAdminAuthenticated,
  adminController.adminOrderdetails
);

module.exports = router;
