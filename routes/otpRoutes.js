const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otpController");

router.get("/verifyOtp", otpController.verifyOtp);
router.post("/verifyOtp", otpController.postVerifyOtp);
router.get("/verifyforgotpswOtp", otpController.verifyforgotpswOtp);

router.post("/verifyforgotpswOtp", otpController.postverifyforgotpswOtp);

module.exports = router;
