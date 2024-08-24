const UserModel = require("../models/user");
const userOtpModel = require("../models/userOtpVerification");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const cartModel = require("../models/cart");
const Product = require("../models/addproducts");
const couponsModel = require("../models/coupons");
const categoryModel = require("../models/category");

const orderModel = require("../models/order");
const category = require("../models/category");

require("dotenv").config();
const loginPage = function (req, res) {
  // res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    // req.session.user = null;

    res.render("login.ejs");
  } catch (e) {
    console.error(e);
  }
};

const postLoginPage = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);

    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log("not user working");
      req.flash("error", "Invalid Email");
      return res.redirect("/user/login");
    }
    if (user.isBlocked) {
      console.log("blocked");
      req.flash("error", "Your Account has been blocked by the admin");
      return res.redirect("/user/login");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("no match password");
      req.flash("error", "Invalid Password");
      return res.redirect("/user/login");
    }
    req.session.user = user;

    console.log("user working");
    res.redirect("/user/");
  } catch (e) {
    console.error(e);
  }
};

const displayMainPage = async function (req, res) {
  req.session.ordercode = null;
  // Coupon
  req.session.couponCode = null;
  req.session.couponapplied = null;
  // const thirtyDaysFromNow = new Date();
  // thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // let coupons = new couponsModel({
  //   couponCode: "iiiiiH",
  //   min: 50,
  //   max: 1000,
  //   ExpiryDate: thirtyDaysFromNow,
  //   Discount: 20,
  // });
  // await coupons.save();
  let ITEMS_ = 8;
  const page = parseInt(req.query.page) || 1;

  const skip = (page - 1) * ITEMS_;
  if (req.session && req.session.user) {
    if (req.session.user.isAdmin) {
      res.redirect("/admin/");
    } else {
      const userId = req.session.user._id.toString();
      const products = await Product.find({ productStock: { $gt: 0 } })
        .skip(skip)
        .limit(ITEMS_);
      const categories = await categoryModel.find();

      let cartProductCount = 0;
      for (const product of products) {
        product.totalProductCount = 0;

        await product.save();
      }

      const categoryMap = new Map(
        categories.map((category) => [
          category.categoryName,
          category.discountpercentage,
        ])
      );

      for (const product of products) {
        if (categoryMap.has(product.productCategory)) {
          product.categoryDiscount = categoryMap.get(product.productCategory);
        } else {
          product.categoryDiscount = 0;
        }
        await product.save();
      }
      const cart = await cartModel.findOne({ userId: userId });
      if (cart) {
        cartProductCount = cart.productsInfo.length;
      }

      const totalProductsCount = await Product.find({
        productStock: { $gt: 0 },
      }).countDocuments();
      const totalPages = Math.ceil(totalProductsCount / ITEMS_);

      res.render("index.ejs", {
        products,
        cartProductCount: cartProductCount,
        currentPage: page,
        totalPages,
      });
    }
  } else {
    console.log("loginhhhh");
    res.redirect("/user/login");
  }
};

async function displayAdminPage(req, res) {
  // Prevent caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const user = await UserModel.find({ isAdmin: false });
    if (!user) {
      res.json({
        status: "Failed",
        message: error.message,
      });
    }
    //  all users with isAdmin set to false
    res.render("admin.ejs", { user });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.redirect("/user/login");
  }
}

function postLogOut(req, res) {
  try {
    req.session.user = null;
    res.setHeader("Cache-Control", "no-store, max-age=0");

    req.session.destroy();
    res.redirect("/user/login");
  } catch (e) {
    console.error(e);
    res.redirect("/user/");
  }
}

const displayRegister = (req, res) => {
  res.render("register.ejs");
};

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail", // Use your email service provider (e.g., 'Gmail', 'Outlook', etc.)
  auth: {
    user: process.env.email, // Your email address
    pass: process.env.password, // Your email password (use an application-specific password for security)
  },
});
const sendOtpVerificationEmail = async (email) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    // const hashedotp = await bcrypt.hash(otp, 10); // Hash the OTP

    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "Verify your Email",
      html: `Your OTP is: ${otp}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return {
      status: "PENDING",
      message: "Verification OTP email sent",
      data: {
        email: email,
        // hashedotp: hashedotp, // Send the hashed OTP for verification
        otp,
      },
    };
  } catch (error) {
    throw error;
  }
};

async function postRegister(req, res) {
  const { firstname, lastname, email, contactnumber, password } = req.body;
  let wallet = [];
  if (req.session.referralCode) {
    let referralid = req.session.referralCode;
    let userdetails = await UserModel.findOne({ _id: referralid });
    let date = Date.now();
    if (userdetails) {
      wallet.push({ amount: 200, walletdate: date });
    }
  }

  try {
    let user = await UserModel.findOne({ email });
    const nameRegex = /^[a-zA-Z]+$/;

    if (!nameRegex.test(firstname) || !nameRegex.test(lastname)) {
      req.flash("error", "Enter the values correctly");
      return res.redirect("/user/register");
    }
    const contactNumberRegex = /^[0-9]+$/;
    if (!contactNumberRegex.test(contactnumber) || contactnumber.length < 7) {
      req.flash("error", "Enter the Contact Number correctly");
      return res.redirect("/user/register");
    }
    if (user) {
      return res.redirect("/user/login");
    }

    if (password.length <= 4 || /\s/.test(password)) {
      req.flash("error", "Password should have four or more characters");
      return res.redirect("/user/register");
    }
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    const result = await sendOtpVerificationEmail(email);
    // console.log(result.data.otp);

    const hashedPsw = await bcrypt.hash(password, 10);
    // Store the OTP and its expiration time in the database
    user = new UserModel({
      firstname,
      lastname,
      email,
      contactnumber,
      password: hashedPsw,
      isAdmin: false,
      isBlocked: false,
      verified: false,
      otp: {
        code: result.data.otp,
        expiresAt: expirationTime,
      },
      forgotpswcode: {
        code: result.data.otp,
        expiresAt: expirationTime,
      },
      address: [
        {
          addressCountry: "India",
          addressState: "Kerela",
          postalCode: 686632,
          addressCity: "Kochi",
          addressLocality: "Maradu",
          houseaddress: "123 Random Street",
        },
        {
          addressCountry: "India",
          addressState: "Kerela",
          postalCode: 686630,
          addressCity: "Kochi",
          addressLocality: "Maradu",
          houseaddress: "143 Random Street",
        },
        {
          addressCountry: "India",
          addressState: "Kerela",
          postalCode: 686639,
          addressCity: "Kochi",
          addressLocality: "Maradu",
          houseaddress: "153 Random Street",
        },
      ],
      wallet,
    });
    req.session.referralCode = null;
    // Save the new user to the database
    await user.save();

    // Set the user data in the session
    req.session.user = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    // Redirect the user to the OTP verification page
    res.redirect("/otp/verifyOtp");
  } catch (error) {
    res.json({
      status: "Failed",
      message: error.message,
    });
  }
}

const userLogOut = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
    }
    res.redirect("/user/login");
  });
};
function checkAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect("/user/login");
}
const redirectRouter = (req, res, next) => {
  res.redirect("/user/login");
};

function checkNotAuthenticated(req, res, next) {
  if (!(req.session && req.session.user)) {
    return next();
  }
  res.redirect("/user/");
}
function checkuserauth(req, res, next) {
  if (!(req.session && req.session.user)) {
    return next();
  }
  res.redirect("/user/");
}
async function userProfile(req, res) {
  try {
    if (!req.session.user) {
      console.log("User not found");
      return res.status(404).send("You are not logged in");
    }

    const user = await UserModel.findOne({ _id: req.session.user._id });

    if (!user) {
      console.log("User not found");
      return res.status(404).send("User not found");
    }

    console.log("User data:", user);

    res.render("userprofile", { user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function productdetails(req, res) {
  try {
    const productId = req.params.productId;
    const data = await Product.findById(productId);

    if (!data) {
      return res.status(404).send("Product not found");
    }
    const hsdcode = await bcrypt.hash("order", 10);
    if (data.productOffer === 0 && data.categoryDiscount > 0) {
      data.productPrice = (
        (1 - data.categoryDiscount / 100) *
        data.productPrice
      ).toFixed(2);
    } else if (data.productOffer > 0) {
      data.productPrice = (
        (1 - data.productOffer / 100) *
        data.productPrice
      ).toFixed(2);
    }

    req.session.ordercode = hsdcode;
    res.render("product", { data });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
}

function displayForgotPasswordEmail(req, res) {
  res.render("forgotpasswordemail.ejs");
}

async function postForgotpassword(req, res) {
  const { email } = req.body;
  try {
    let user = await UserModel.findOne({ email });

    if (!user) {
      req.flash("error", "INVALID EMAIL");
      return res.redirect("/Otp");
    }
    const expirationTime = new Date();
    console.log(expirationTime);
    expirationTime.setSeconds(expirationTime.getSeconds() + 30);
    console.log(expirationTime);
    const result = await sendOtpVerificationEmail(email);

    user.forgotpswcode = {
      code: result.data.otp,
      expiresAt: expirationTime,
    };

    await user.save();

    req.session.user = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    console.log(req.session.user);
    res.redirect("/otp/verifyforgotpswOtp");
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/user/forgotpaswordemail");
  }
}

function displayCreateNewPassword(req, res) {
  res.render("createNewPassword.ejs");
}

async function postdisplayCreateNewPassword(req, res) {
  const { password, confirmpassword } = req.body;
  try {
    const { email } = req.session.user;

    if (password === confirmpassword) {
      let user = await UserModel.findOne({ email });
      const hashedPsw = await bcrypt.hash(password, 10);
      user.password = hashedPsw;
      await user.save();
      res.redirect("/user/login");
    } else {
      req.flash("error", "Password don't match");
      res.redirect("/user/createnewpassword");
    }
  } catch (error) {
    req.flash("error", "Error Try Again");

    res.redirect("/user/createnewpassword");
  }
}

async function addToCartBtn(req, res) {
  try {
    const productId = req.params.productId;
    let productadded = false;
    if (!productId) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Convert userId to a string representing the ObjectId
    const userIdString = req.session.user._id.toString();

    let userCart = await cartModel.findOne({ userId: userIdString });
    let productPrice;
    let product = await Product.findOne({ _id: productId });
    if (product.productOffer === 0 && product.categoryDiscount) {
      productPrice = (
        (1 - product.categoryDiscount / 100) *
        product.productPrice
      ).toFixed(2);
    } else if (product.productOffer > 0) {
      productPrice = (
        (1 - product.productOffer / 100) *
        product.productPrice
      ).toFixed(2);
    } else {
      productPrice = product.productPrice;
    }

    if (!userCart) {
      userCart = new cartModel({
        userId: userIdString,
        productsInfo: [{ productId, isOrdered: false, count: 1, productPrice }],
      });
      productadded = true;
    } else {
      const productInfo = userCart.productsInfo.find(
        (info) => info.productId == productId
      );
      if (productInfo && productInfo.count < product.productStock) {
        productInfo.count++;
      } else if (!productInfo) {
        userCart.productsInfo.push({
          productId,
          isOrdered: false,
          count: 1,
          productPrice,
        });
      }
      productadded = true;
    }
    await userCart.save();
    // user.productsInfo.forEach((info) => {
    //   if (info.productId == productId) {
    //     id = productId;
    //   }
    // });

    // if (user && product) {
    //   product.totalProductCount += 1;
    //   await product.save();
    // }

    // if (user) {
    //   user.productsInfo.push({ productId });

    //   await user.save();
    // } else {
    //   user = new cartModel({
    //     userId: userIdString,
    //     productsInfo: [{ productId, isOrdered: false, count: 0 }],
    //   });
    //   await user.save();
    // }

    res
      .status(200)
      .json({ message: "product succesfully added", productadded });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
}
async function usercart(req, res) {
  try {
    const userIdString = req.session.user._id.toString();

    let user = await cartModel.findOne({ userId: userIdString });

    if (user) {
      const productIds = user.productsInfo.map(
        (productInfo) => productInfo.productId
      );

      const products = await Product.find({ _id: { $in: productIds } });

      for (const product of products) {
        const cartProductInfo = user.productsInfo.find(
          (info) => info.productId.toString() === product._id.toString()
        );

        if (cartProductInfo) {
          product.count = cartProductInfo.count;
          await product.save();
        }

        if (product.productOffer === 0 && product.categoryDiscount > 0) {
          product.productPrice = (
            (1 - product.categoryDiscount / 100) *
            product.productPrice
          ).toFixed(2);
        } else if (product.productOffer > 0) {
          product.productPrice = (
            (1 - product.productOffer / 100) *
            product.productPrice
          ).toFixed(2);
        }
      }

      let total = 0;
      for (const product of user.productsInfo) {
        total = total + product.count * product.productPrice;
      }
      console.log(total);
      // products.map((item, index) => {
      //   total += item.productPrice * item.totalProductCount;
      // });
      let deliveryCharge = 500;
      const totalPrice = total + deliveryCharge;

      res.render("userCart.ejs", { products, total, totalPrice });
      // return res.status(404).json({ error: "User not found" });
    } else {
      res.redirect("/user/");
    }
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
}
async function cartDeleteProduct(req, res) {
  try {
    const productIdToRemove = req.params.productId;
    const userId = req.session.user._id.toString();

    let user = await cartModel.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User cart not found" });
    }

    // Use the $pull operator to remove the product by its productId
    user.productsInfo = user.productsInfo.filter(
      (product) => product.productId.toString() !== productIdToRemove
    );

    await user.save();
    res.redirect("/user/userCart");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function updateProductCount(req, res) {
  try {
    const productId = req.params.productId;
    const newCount = req.body.count;
    const userId = req.session.user._id.toString();
    let valuechanged = true;
    // await Product.findByIdAndUpdate(productId, { totalProductCount: newCount });
    const cartProducts = await cartModel.findOne({ userId });

    const productIds = cartProducts.productsInfo.map(
      (productInfo) => productInfo.productId
    );
    const products = await Product.find({ _id: { $in: productIds } });

    for (const id of productIds) {
      let product = await Product.findOne({ _id: id });
      cartProducts.productsInfo.forEach((info) => {
        if (productId == product._id && newCount <= product.productStock) {
          if (info.productId == productId) {
            info.count = newCount;
            valuechanged = false;
          }
        }
      });
    }

    cartProducts.save();

    for (const productInfo of cartProducts.productsInfo) {
      const product = products.find(
        (p) => p._id.toString() === productInfo.productId.toString()
      );
      if (product) {
        product.totalProductCount = productInfo.count;
        await product.save();
      }
    }

    for (const product of products) {
      if (product.productOffer === 0 && product.categoryDiscount) {
        product.productPrice = (
          (1 - product.categoryDiscount / 100) *
          product.productPrice
        ).toFixed(2);
      } else {
        product.productPrice = (
          (1 - product.productOffer / 100) *
          product.productPrice
        ).toFixed(2);
      }
    }

    let total = 0;
    products.map((item, index) => {
      total += item.productPrice * item.totalProductCount;
    });
    let deliveryCharge = 500;
    const totalPrice = total + deliveryCharge;

    res.status(200).json({
      message: "Product count updated successfully",
      newCount,
      productId,
      total,
      totalPrice,
      valuechanged,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function checkout(req, res) {
  try {
    const userId = req.session.user._id.toString();
    const user = await cartModel.findOne({ userId });
    const hsdcode = await bcrypt.hash("order", 10);

    req.session.ordercode = hsdcode;
    console.log(user);
    if (user) {
      const productIds = user.productsInfo.map(
        (productInfo) => productInfo.productId
      );
      const products = await Product.find({ _id: { $in: productIds } });
      for (const productInfo of user.productsInfo) {
        const product = products.find(
          (p) => p._id.toString() === productInfo.productId.toString()
        );
        if (product) {
          product.totalProductCount = productInfo.count;
          await product.save();
        }
      }
      for (const product of products) {
        if (product.productOffer === 0 && product.categoryDiscount) {
          product.productPrice = (
            (1 - product.categoryDiscount / 100) *
            product.productPrice
          ).toFixed(2);
        } else {
          product.productPrice = (
            (1 - product.productOffer / 100) *
            product.productPrice
          ).toFixed(2);
        }
      }
      let total = 0;
      products.map((item, index) => {
        total += item.productPrice * item.totalProductCount;
      });
      let deliveryCharge = 500;
      const totalPrice = total + deliveryCharge;
      res.render("checkout", { products, total, totalPrice });
    } else {
      res.status(400).json({ error: "no products in the cart" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
async function checkoutProductDetails(req, res) {
  const productId = req.params.productId;
  try {
    let products = [];
    const productdetails = await Product.findById(productId);
    if (
      productdetails.productOffer === 0 &&
      productdetails.categoryDiscount > 0
    ) {
      productdetails.productPrice = (
        (1 - productdetails.categoryDiscount / 100) *
        productdetails.productPrice
      ).toFixed(2);
    } else if (productdetails.productOffer > 0) {
      productdetails.productPrice = (
        (1 - productdetails.productOffer / 100) *
        productdetails.productPrice
      ).toFixed(2);
    }

    products.push(productdetails);
    const total = productdetails.productPrice;

    let deliveryCharge = 500;
    const totalPrice = total + deliveryCharge;
    req.session.productId = productId;
    res.render("checkout", { products, total, totalPrice });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}
async function paymentSelection(req, res) {
  try {
    let order;
    const currentDate = Date.now();
    const productId = req.session.productId;
    const product = await Product.findById(productId);
    const userId = req.session.user._id.toString();
    const hashedid = await bcrypt.hash("password", 10);
    let coupons;
    const user = await UserModel.findOne({ _id: userId });
    const usedCouponsArray = user.usedCoupons;
    console.log(usedCouponsArray);
    if (usedCouponsArray) {
      coupons = await couponsModel.find({
        couponCode: { $nin: usedCouponsArray },
      });
    } else {
      coupons = await couponsModel.find();
    }
    let walletamount = 0;
    user.wallet.forEach((transaction) => {
      walletamount = walletamount + transaction.amount;
    });

    if (product) {
      let deliveryCharge = 500;
      if (product.productOffer === 0 && product.categoryDiscount > 0) {
        product.productPrice = (
          (1 - product.categoryDiscount / 100) *
          product.productPrice
        ).toFixed(2);
      } else if (product.productOffer > 0) {
        product.productPrice = (
          (1 - product.productOffer / 100) *
          product.productPrice
        ).toFixed(2);
      }
      let price = product.productPrice;

      const totalPrice = price + deliveryCharge;

      const productInfo = [
        {
          productId: product._id,
          OrderedState: "pending",
          count: 1,
          productName: product.productName,
        },
      ];

      req.session.orderid = hashedid;
      order = new orderModel({
        userId,
        userName: user.firstname,
        productsInfo: productInfo,
        Date: currentDate,
        OrderedState: "pending",
        orderId: hashedid,
        totalPrice,
      });
      req.session.totalPrice = totalPrice;
      await order.save();

      return res.render("payment&address", {
        user,
        totalPrice,
        price,
        walletamount,
        coupons,
      });
    } else {
      const usercart = await cartModel.findOne({ userId });
      const user = await UserModel.findOne({ _id: userId });
      let walletamount = 0;
      user.wallet.forEach((transaction) => {
        walletamount = walletamount + transaction.amount;
      });
      if (!user) {
        res.status(404).send("User not found");
        return;
      }

      let totalPrice = 0;
      let price = 0;
      let deliveryCharge = 500;
      if (usercart) {
        const productIds = usercart.productsInfo.map(
          (productInfo) => productInfo.productId
        );
        const products = await Product.find({ _id: { $in: productIds } });

        products.forEach((item) => {
          if (item.productOffer === 0 && item.categoryDiscount) {
            item.productPrice = (
              (1 - item.categoryDiscount / 100) *
              item.productPrice
            ).toFixed(2);
          } else {
            item.productPrice = (
              (1 - item.productOffer / 100) *
              item.productPrice
            ).toFixed(2);
          }

          price += item.productPrice * item.totalProductCount;
        });
        console.log(price, "price usercart");
        totalPrice = price + deliveryCharge;

        const productInfo = products.map((product) => ({
          productId: product._id,

          count: product.totalProductCount,
          productName: product.productName,
        }));

        order = new orderModel({
          userId,
          userName: user.firstname,
          productsInfo: productInfo,
          Date: currentDate,
          OrderedState: "pending",
          orderId: hashedid,
          totalPrice,
        });

        req.session.orderid = hashedid;
        await order.save();

        res.render("payment&address", {
          user,
          totalPrice,
          price,
          walletamount,
          coupons,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
}

async function editAddress(req, res) {
  const userId = req.session.user._id.toString();

  const user = await UserModel.findOne({ _id: userId });
  res.render("editAddress", { user });
}

async function updateAddress(req, res) {
  try {
    const userId = req.session.user._id.toString();
    const user = await UserModel.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const selectedAddressIndex = req.body.selectedAddressIndex;
    const {
      houseaddress,
      addressLocality,
      addressCity,
      postalCode,
      addressState,
      addressCountry,
    } = req.body;

    user.address[selectedAddressIndex] = {
      houseaddress,
      addressLocality,
      addressCity,
      postalCode,
      addressState,
      addressCountry,
    };

    await user.save();

    res.redirect("/user/editAddress");
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function deleteAddress(req, res) {
  try {
    const userId = req.session.user._id.toString(); // Get the user's ID from the session
    const user = await UserModel.findOne({ _id: userId }, {});

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const selectedAddressIndex = req.body.selectedAddressIndex; // Get the selected address index from the form

    user.address[selectedAddressIndex] = {
      houseaddress: "",
      addressLocality: "",
      addressCity: "",
      postalCode: "",
      addressState: "",
      addressCountry: "",
    };

    // Save the updated user object to the database
    await user.save();

    res.redirect("/user/editAddress"); // Redirect to the edit address page or any other appropriate page
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function cancelOrder(req, res) {
  try {
    const orderId = req.session.orderid;
    const order = await orderModel.findOneAndUpdate(
      { orderId },
      { OrderedState: "canceled" }
    );
    req.session.ordercode = null;
    req.session.productId = null;
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.redirect("/user/");
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
function checkorderCanceled(req, res, next) {
  if (req.session && req.session.ordercode) {
    return next();
  }
  res.redirect("/user/");
}

async function registerresendotp(req, res) {
  try {
    const userId = req.session.user._id.toString();
    console.log(userId);
    const email = req.session.user.email;
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    // Send the OTP email
    const result = await sendOtpVerificationEmail(email);
    await UserModel.findByIdAndUpdate(
      { _id: userId },
      { "otp.code": result.data.otp, "otp.expiresAt": expirationTime }
    );
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

async function forgotpswresendotp(req, res) {
  try {
    const userId = req.session.user._id.toString();

    const email = req.session.user.email;
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    // Send the OTP email
    const result = await sendOtpVerificationEmail(email);
    await UserModel.findByIdAndUpdate(
      { _id: userId },
      {
        "forgotpswcode.code": result.data.otp,
        "forgotpswcode.expiresAt": expirationTime,
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

async function checkBlocked(req, res, next) {
  const userId = req.session.user._id.toString();
  const user = await UserModel.findOne({ _id: userId });
  console.log(user, "blocked use//////////////////////////////////////");
  if (user.isBlocked) {
    req.flash("error", "Your Account has been blocked by the admin");
    return res.redirect("/user/login");
  } else {
    return next();
  }
}

async function usereditdetails(req, res) {
  try {
    const user_id = req.session.user._id.toString();

    const userdetails = await UserModel.findOne({ _id: user_id });

    res.render("edituserdetails", { userdetails });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function postedituserdetails(req, res) {
  try {
    const { email, firstName, lastName, contactNumber } = req.body;
    const user_id = req.session.user._id.toString();

    const userdetails = await UserModel.findOne({ _id: user_id });

    if (firstName) {
      userdetails.firstname = firstName;
    }
    if (lastName) {
      userdetails.lastname = lastName;
    }
    if (email) {
      userdetails.email = email;
    }
    if (contactNumber) {
      userdetails.contactnumber = contactNumber;
    }
    await userdetails.save();
    res.redirect("/user/userprofile.");
  } catch (error) {
    res.status(500).json({ message: "server Error" });
  }
}
module.exports = {
  displayMainPage,
  loginPage,
  postLoginPage,
  displayAdminPage,
  postLogOut,
  displayRegister,
  postRegister,
  userLogOut,
  checkAuthenticated,
  checkNotAuthenticated,
  sendOtpVerificationEmail,
  userProfile,
  productdetails,
  displayForgotPasswordEmail,
  postForgotpassword,
  displayCreateNewPassword,
  postdisplayCreateNewPassword,
  addToCartBtn,
  usercart,
  cartDeleteProduct,
  updateProductCount,
  checkout,
  checkoutProductDetails,
  paymentSelection,

  updateAddress,
  deleteAddress,
  editAddress,
  cancelOrder,
  checkorderCanceled,
  registerresendotp,
  forgotpswresendotp,
  checkBlocked,
  usereditdetails,
  postedituserdetails,

  redirectRouter,
  checkuserauth,
};
