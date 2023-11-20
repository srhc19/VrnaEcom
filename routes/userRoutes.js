const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

//controllers
const userController = require("../controllers/usercontrollers");
const paymentController = require("../controllers/paymentController");
const wishlistController = require("../controllers/wishlistController");
const categoryController = require("../controllers/categoryController");
const orderController = require("../controllers/orderController");
const { addProducts } = require("../controllers/adminController");
const offerController = require("../controllers/offerController");









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

router.post("/user/paymentSuccess", paymentController.paymentSuccess);

router.post("/getrazorpayID", paymentController.getrazorpayID);

router.post("/razorrejection", paymentController.razorrejection);

router.get(
  "/failedPayment",
  userController.checkorderCanceled,
  paymentController.failedPayment
);

router.get("/mainproductSearch", categoryController.mainproductSearch);

router.post("/storeTotalPrice", orderController.storeTotalPrice);

router.post("/updateTotalPrice", orderController.functionupdateTotalPrice);

router.post("/findCoupon", offerController.findCoupon);

router.post("/changeCouponCode", offerController.changeCouponCode);

router.get(
  "/userOrderDetails",
  userController.checkBlocked,
  orderController.userOrderDetails
);

router.get(
  "/userorderCancel/:orderId",
  userController.checkBlocked,
  orderController.userorderCancel
);

router.get(
  "/userorderReturn/:userId",
  userController.checkBlocked,
  orderController.userorderReturn
);

router.post(
  "/userReturnProduct/:orderId",
  userController.checkBlocked,
  orderController.userReturnProduct
);

router.get(
  "/Hoodie",
  userController.checkAuthenticated,
  userController.checkBlocked,
  categoryController.Hoodie
);

router.get(
  "/Hoodie-pagination",
  userController.checkAuthenticated,
  userController.checkBlocked,
  categoryController.Hoodie_pagination
);

router.get(
  "/T-Shirt",
  userController.checkAuthenticated,
  userController.checkBlocked,
  categoryController.T_Shirt
);

router.get(
  "/t-Shirt-pagination",
  userController.checkAuthenticated,
  userController.checkBlocked,
  categoryController.tShirt_pagination
);

router.get(
  "/whishlist",
  userController.checkAuthenticated,
  userController.checkBlocked,
  wishlistController.wishlist
);

router.post("/addproduct-whistlist", wishlistController.addproduct_whistlist);

router.get("/whishliststyle", wishlistController.whishliststyle);

router.post(
  "/removeproduct-whistlist",
  wishlistController.removeproduct_whistlist
);

router.get("/invoice/:id", orderController.invoice);

router.get(
  "/orderdetailsfinal",
  userController.checkAuthenticated,
  userController.checkBlocked,
  orderController.orderdetailsfinal
);

router.get("/usereditdetails", userController.usereditdetails);

router.post("/postedituserdetails", userController.postedituserdetails);
router.get(
  "/main-page_pagination",
  userController.checkAuthenticated,
  userController.checkBlocked,
  categoryController.main_page_pagination
);

router.get(
  "/orderdetails/:orderId",
  userController.checkAuthenticated,
  userController.checkBlocked,
  orderController.orderdetails
);

router.get("/Signup", offerController.Signup);

router.get("/walletHistory", offerController.walletHistory);

module.exports = router;
