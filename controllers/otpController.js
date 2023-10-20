const UserModel = require("../models/user");
const flash = require("express-flash");

function verifyOtp(req, res) {
  res.render("registerOtp.ejs");
}

async function postVerifyOtp(req, res) {
  try {
    const { otp } = req.body;
    const { email } = req.session.user;

    // Find the user by email
    const user = await UserModel.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/otp/verifyOtp");
    }

    // Check if the OTP is expired
    if (new Date() > user.otp.expiresAt) {
      req.flash("error", "OTP has expired");
      return res.redirect("/otp/verifyOtp");
    }

    // Compare the entered OTP with the stored OTP code
    if (otp === user.otp.code) {
      // Update the user' 'verified' status
      user.verified = true;
      await user.save();
      console.log("postverify");
      res.redirect("/user/login");
    } else {
      req.flash("error", "Invalid OTP");
      return res.redirect("/otp/verifyOtp");
    }
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/otp/verifyOtp");
  }
}

function verifyforgotpswOtp(req, res) {
  res.render("forgotpasswordOtp.ejs");
}

async function postverifyforgotpswOtp(req, res) {
  try {
    const { otp } = req.body;
    const { email } = req.session.user;
    console.log(req.session.user);

    // Find the user by email
    const user = await UserModel.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/otp/verifyforgotpswOtp");
    }
    console.log(new Date());
    console.log(new Date(user.forgotpswcode.expiresAt));
    // Check if the OTP is expired
    if (new Date() > user.forgotpswcode.expiresAt) {
      req.flash("error", "OTP has expired");
      return res.redirect("/otp/verifyforgotpswOtp");
    }

    // Compare the entered OTP with the stored OTP code
    if (otp === user.forgotpswcode.code) {
      // Update the user' 'verified' status

      res.redirect("/user/createnewpassword");
    } else {
      req.flash("error", "Invalid OTP");
      return res.redirect("/otp/verifyforgotpswOtp");
    }
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/otp/verifyforgotpswOtp");
  }
}

module.exports = {
  verifyOtp,
  postVerifyOtp,
  verifyforgotpswOtp,
  postverifyforgotpswOtp,
};
