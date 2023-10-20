const UserModel = require("../models/user");
const userOtpModel = require("../models/userOtpVerification");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const cartModel = require("../models/cart");
const Product = require("../models/addproducts");

const orderModel = require("../models/order");

const loginPage = function (req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  req.session.user = null;

  res.render("login.ejs");
};

const postLoginPage = async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    req.flash("error", "Invalid Email");
    return res.redirect("/user/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("error", "Invalid Password");
    return res.redirect("/user/login");
  }
  req.session.user = user;

  // req.session.user = {
  //   _id: user._id,

  //   email: user.email,
  //   isAdmin: user.isAdmin, // Store the isAdmin information in the session
  // };
  res.redirect("/user/");
};

const displayMainPage = async function (req, res) {
  // Prevent caching
  res.setHeader("Cache-Control", "no-store, max-age=0");
  //if user is in session
  if (req.session && req.session.user) {
    if (req.session.user.isAdmin) {
      res.redirect("/admin/");
    } else {
      const products = await Product.find();
      res.render("index.ejs", { products });
    }
  } else {
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
  req.session.user = null; // Clear  user property in the session
  // Set cache-control headers to prevent caching
  res.setHeader("Cache-Control", "no-store, max-age=0");
  // Clear  session data completely
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/user/login");
  });
}

const displayRegister = (req, res) => {
  res.render("register.ejs");
};

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail", // Use your email service provider (e.g., 'Gmail', 'Outlook', etc.)
  auth: {
    user: "srh.c1912345@gmail.com", // Your email address
    pass: "wmvb ukvo gwau enjw", // Your email password (use an application-specific password for security)
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

  try {
    let user = await UserModel.findOne({ email });

    if (user) {
      return res.redirect("/user/login");
    }

    // Calculate the expiration time
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    // Send the OTP email
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
    });

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

function checkNotAuthenticated(req, res, next) {
  if (!(req.session && req.session.user)) {
    return next();
  }
  res.redirect("/");
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
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);
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
    if (!productId) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Convert userId to a string representing the ObjectId
    const userIdString = req.session.user._id.toString();

    let user = await cartModel.findOne({ userId: userIdString });

    if (user) {
      user.productsInfo.push({ productId });
      await user.save();
    } else {
      // create a new cart
      user = new cartModel({
        userId: userIdString,
        productsInfo: [{ productId, isOrdered: false, count: 0 }],
      });
      await user.save();
    }

    res.redirect("/user/");
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

      // Query the Product collection to retrieve product details based on IDs
      const products = await Product.find({ _id: { $in: productIds } });

      // Loop through the products and update the count from user's cart
      for (const product of products) {
        const cartProductInfo = user.productsInfo.find(
          (info) => info.productId.toString() === product._id.toString()
        );

        if (cartProductInfo) {
          // Update the product's count field
          product.count = cartProductInfo.count;
          await product.save();
        }
      }

      // Render an EJS template with the retrieved product details
      res.render("usercart.ejs", { products });
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
    const newCount = parseInt(req.body.count); // Get the updated count from the client

    // Update the product's totalProductCount field in the database
    await Product.findByIdAndUpdate(productId, { totalProductCount: newCount });

    res.status(200).json({ message: "Product count updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function checkout(req, res) {
  try {
    const userId = req.session.user._id.toString();
    const user = await cartModel.findOne({ userId });

    if (user) {
      const productIds = user.productsInfo.map(
        (productInfo) => productInfo.productId
      );
      const products = await Product.find({ _id: { $in: productIds } });
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

    const user = await UserModel.findOne({ _id: userId });
    if (product) {
      let deliveryCharge = 500;
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

      order = new orderModel({
        userId,
        userName: user.firstname,
        productsInfo: productInfo,
        Date: currentDate,
        OrderedState: "pending",
      });
      await order.save();
      res.render("payment&address", { user, totalPrice, price });
    } else {
      const usercart = await cartModel.findOne({ userId });
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
          price += item.productPrice * item.totalProductCount;
        });

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
        });
        await order.save();

        res.render("payment&address", { user, totalPrice, price });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
}

async function orderConfirmed(req, res) {
  const userId = req.session.user._id.toString();
  req.session.productId = null;
  const usercart = await cartModel.deleteOne({ userId });
  res.render("orderConfirm");
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

    // Update the address at the selected index
    user.address[selectedAddressIndex] = {
      houseaddress,
      addressLocality,
      addressCity,
      postalCode,
      addressState,
      addressCountry,
    };

    await user.save();

    res.redirect("/user/editAddress"); // Redirect to the edit address page or any other appropriate page
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function deleteAddress(req, res) {
  try {
    const userId = req.session.user._id.toString(); // Get the user's ID from the session
    const user = await UserModel.findOne({ _id: userId });

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
  orderConfirmed,
  updateAddress,
  deleteAddress,
  editAddress,
};
