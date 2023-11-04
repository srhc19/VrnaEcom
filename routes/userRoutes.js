const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const userController = require("../controllers/usercontrollers");
const cartModel = require("../models/cart");
const Product = require("../models/addproducts");
const UserModel = require("../models/user");
const orderModel = require("../models/order");

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
  userController.displayMainPage
);
router.delete("/logout", userController.userLogOut);

router.get("/forgotpaswordemail", userController.displayForgotPasswordEmail);

router.post("/forgotpaswordemail", userController.postForgotpassword);

router.get("/createnewpassword", userController.displayCreateNewPassword);

router.post("/createnewpassword", userController.postdisplayCreateNewPassword);

router.get("/addTOCartBtn/:productId", userController.addToCartBtn);

router.get("/usercart", userController.usercart);

router.get("/userCart/delete/:productId", userController.cartDeleteProduct);
router.post(
  "/update-product-count/:productId",
  userController.updateProductCount
);

router.get("/checkout", userController.checkout);

router.get("/checkout/:productId", userController.checkoutProductDetails);

router.get(
  "/paymentSelection",
  userController.checkorderCanceled,
  userController.paymentSelection
);

router.get("/orderConfirmed", userController.orderConfirmed);
router.get("/editAddress", userController.editAddress);
router.post("/updateAddress", userController.updateAddress);

// Handle deleting an address
router.post("/deleteAddress", userController.deleteAddress);

router.get("/registerresendOtp", userController.registerresendotp);

router.get("/forgotpswresendotp", userController.forgotpswresendotp);

module.exports = router;
