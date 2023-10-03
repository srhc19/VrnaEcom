const addproductsModel = require("../models/addproducts");
const UserModel = require("../models/user");
const userOtpModel = require("../models/userOtpVerification");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const postLoginPage = async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    req.flash("error", "Invalid Email");
    return res.redirect("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("error", "Invalid Password");
    return res.redirect("/login");
  }

  req.session.user = {
    _id: user._id,

    email: user.email,
    isAdmin: user.isAdmin, // Store the isAdmin information in the session
  };
  res.redirect("/");
};

const displayMainPage = async function (req, res) {
  // Prevent caching
  res.setHeader("Cache-Control", "no-store, max-age=0");
  //if user is in session
  if (req.session && req.session.user) {
    if (req.session.user.isAdmin) {
      res.redirect("/admin");
    } else {
      const products = await addproductsModel.find();
      res.render("index.ejs", { products });
    }
  } else {
    res.redirect("/login");
  }
};

const loginPage = function (req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.render("login.ejs");
};
async function displayAdminPage(req, res) {
  // Prevent caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const user = await UserModel.find({ isAdmin: false });

    //  all users with isAdmin set to false
    res.render("admin.ejs", { user });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.redirect("/login");
  }
}

function postLogOut(req, res) {
  req.session.user = null; // Clear  user property in the session

  // Clear  session data completely
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/login");
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
      html: `Your OTP is: ${otp}`, // You can customize the email content
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
      return res.redirect("/login");
    }

    // Calculate the expiration time
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    // Send the OTP email
    const result = await sendOtpVerificationEmail(email);
    console.log(result.data.otp);

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
    res.redirect("/verifyOtp");
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
    res.redirect("/login");
  });
};
function checkAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (!(req.session && req.session.user)) {
    return next();
  }
  res.redirect("/");
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
};
