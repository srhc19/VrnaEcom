if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const nodemailer = require("nodemailer");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path"); // For handling file uploads
//models
const UserModel = require("./models/user");
const userOtpModel = require("./models/userOtpVerification");
const addProductsModel = require("./models/addproducts");
const categoryModel = require("./models/category");
//controllers
const initializePassport = require("./controllers/passport-config");
const userController = require("./controllers/usercontrollers");
const adminController = require("./controllers/adminController");
const userOtpVerification = require("./models/userOtpVerification");
// const transporter = require("./controllers/nodemailertransporter");

// Function to generate OTP and send email

const dbURI = "mongodb://localhost:27017/vrna";

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,

    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("Mongoose connected");
  });

const store = new MongoDBSession({
  uri: dbURI,
  collection: "mySession",
});

app.use(
  session({
    secret: "key that will sign cookie",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

//css
app.use(express.static("public"));

initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
// send Otp verification

app.get("/", userController.checkAuthenticated, userController.displayMainPage);

app.get(
  "/login",
  userController.checkNotAuthenticated,
  userController.loginPage
);

app.post("/login", userController.postLoginPage);

app.post("/logout", userController.postLogOut);

/////////////////
// User////////
///////////////
app.get(
  "/register",
  userController.checkNotAuthenticated,
  userController.displayRegister
);

app.post(
  "/register",
  userController.checkNotAuthenticated,
  userController.postRegister
);

app.delete("/logout", userController.userLogOut);
/////////////////
// Admin////////
///////////////

app.get(
  "/admin",
  adminController.checkAdminAuthenticated,
  userController.displayAdminPage
);
app.post(
  "/admin/delete/:userId",
  adminController.checkAdminAuthenticated,
  adminController.adminDeleteUser
);

// Handle POST request to update a user
app.post(
  "/admin/update/:userId",
  adminController.checkAdminAuthenticated,
  adminController.adminUpdateUser
);

app.post(
  "/admin/add",
  adminController.checkAdminAuthenticated,
  adminController.adminAddUser
);
app.get("/verifyOtp", (req, res) => {
  res.render("Otp.ejs");
});

app.post("/verifyOtp", async (req, res) => {
  try {
    const { otp } = req.body;
    const { email } = req.session.user; // Get the email from the user's session
    console.log(otp);
    console.log(email);
    // Find the user by email
    const user = await UserModel.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/verifyOtp");
    }

    // Check if the OTP is expired
    if (new Date() > user.otp.expiresAt) {
      req.flash("error", "OTP has expired");
      return res.redirect("/verifyOtp");
    }
    console.log(typeof otp);
    console.log(typeof user.otp.code);
    // Compare the entered OTP with the stored OTP code
    if (otp === user.otp.code) {
      // Update the user's 'verified' status
      user.verified = true;
      await user.save();

      res.redirect("/login");
    } else {
      req.flash("error", "Invalid OTP");
      return res.redirect("/verifyOtp");
    }
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/verifyOtp");
  }
});
//addproducts
// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public"); // Define the folder where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

app.get("/add-product", (req, res) => {
  const successMessage = req.flash("success");
  res.render("addproducts", { successMessage: successMessage });
});
// Handle POST requests to add a new product
// Assuming you have already imported the necessary dependencies and models
// upload.array("images", 10),
// Handle POST requests to add a new product
app.post(
  "/add-product",
  upload.array("images[]", 10),
  // Changed to match input field name
  async (req, res) => {
    try {
      // Extract form data
      const { productName, productCategory, productPrice, productStock } =
        req.body;

      const productImages = req.files.map((file) => `/${file.filename}`);

      // Create a new product
      const newProduct = new addProductsModel({
        productName,
        productCategory,
        productPrice,
        productStock,
        productImages,
      });

      // Save the product to the database
      await newProduct.save();
      req.flash("success", "product added succesfully");
      res.redirect("/add-product");
      // res.status(201).json({ message: "Product added successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.get("/adminproduct", async (req, res) => {
  try {
    const products = await addProductsModel.find();
    res.render("adminproductpage", { products });
  } catch (error) {
    console.log(error);
  }
});
app.listen(3000);
