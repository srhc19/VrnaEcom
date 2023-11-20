const couponsModel = require("../models/coupons");
const UserModel = require("../models/user");

async function findCoupon(req, res) {
  try {
    const enteredCouponCode = req.body.enteredCouponCode;

    const coupon = await couponsModel.findOne({
      couponCode: enteredCouponCode,
    });

    if (!coupon) {
      return res.status(400).json({
        message: "Invalid Coupon",
      });
    }

    if (req.session.couponCode) {
      if (req.session.couponCode === enteredCouponCode) {
        return res.status(400).json({
          message: "Coupon Already Applied",
        });
      }
    }
    if (req.session.couponapplied) {
      return res.status(400).json({
        message: "you can only use one coupon per order",
      });
    }

    const discount = coupon.Discount;
    req.session.couponCode = enteredCouponCode;
    req.session.couponapplied = true;
    res.status(200).json({
      discount,
    });
  } catch (error) {
    res.status(500).json({ Error: "Server Error" });
  }
}

async function changeCouponCode(req, res) {
  try {
    const { code } = req.body;
    const originalPrice = req.session.originalTotalPrice;

    req.session.couponapplied = false;
    req.session.couponCode = null;
    req.session.originalTotalPrice = null;
    res.status(200).json({ originalPrice });
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}
const _PAGE = 3;

async function walletHistory(req, res) {
  try {
    const userid = req.session.user._id.toString();
    const user = await UserModel.findOne({ _id: userid });

    if (!user) {
      res.send("Page not found");
      return;
    }

    let wallet = user.wallet;
    let totalamount = 0;
    wallet.forEach((transaction) => {
      totalamount = totalamount + transaction.amount;
    });

    // Pagination logic
    const page = +req.query.page || 1;
    const startIndex = (page - 1) * _PAGE;
    const endIndex = startIndex + _PAGE;

    const transactionsOnPage = wallet.slice(startIndex, endIndex);

    res.render("wallethistory", {
      wallet: transactionsOnPage,
      totalamount,
      currentPage: page,
      hasNextPage: endIndex < wallet.length,
      hasPrevPage: page > 1,
      nextPage: page + 1,
      prevPage: page - 1,
      lastPage: Math.ceil(wallet.length / _PAGE),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

function Signup(req, res) {
  try {
    const { referral } = req.query;

    req.session.referralCode = referral;

    res.render("register.ejs");
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
}

async function adminCoupons(req, res) {
  try {
    ITEMS_PER_PAGE = 5;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_PER_PAGE;
    const coupons = await couponsModel.find().skip(skip).limit(ITEMS_PER_PAGE);
    const totalProductsCount = await couponsModel.countDocuments();

    const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
    const number = (page - 1) * ITEMS_PER_PAGE + 1;
    res.render("adminCoupons", {
      coupons,
      currentPage: page,
      totalPages,
      number,
    });
  } catch (error) {
    res.status(400).json({ error: "server error" });
  }
}

async function deleteCoupon(req, res) {
  try {
    const couponid = req.params.couponId;
    await couponsModel.findByIdAndDelete({ _id: couponid });
    res.redirect("/admin/adminCoupons");
  } catch (error) {
    res.status(400).json({ error: "Server Error" });
  }
}

async function updateCoupon(req, res) {
  try {
    const couponid = req.params.couponId;
    const { min, max, Discount, expirydate } = req.body;
    const currentDate = new Date();
    const selectedDate = new Date(expirydate);
    if (selectedDate <= currentDate) {
      alert("Expiry date should be set to a future date.");
      return;
    }

    const coupon = await couponsModel.findByIdAndUpdate(
      { _id: couponid },
      { min, max, Discount, expirydate }
    );

    res.redirect("/admin/adminCoupons");
  } catch (error) {
    res.status(400).json({ error: "Server Error" });
  }
}

async function AddCoupon(req, res) {
  try {
    const { couponname, minmum, maximum, Discountpercentage, date } = req.body;

    const couponNameRegex = /^[a-zA-Z0-9]+$/;
    if (!couponNameRegex.test(couponname.value)) {
      alert("Coupon name should contain only letters and numbers.");
      return;
    }

    let coupon = await couponsModel.findOne({ couponCode: couponname });

    const currentDate = new Date();
    const selectedDate = new Date(date);
    if (selectedDate <= currentDate) {
      alert("Expiry date should be set to a future date.");
      return;
    }

    if (coupon) {
      req.flash("error", "Coupon Already Exists");
      res.redirect("/admin/adminCoupons");
    } else {
      coupon = new couponsModel({
        couponCode: couponname,
        min: minmum,
        max: maximum,
        Discount: Discountpercentage,
        expirydate: date,
      });

      await coupon.save();
      req.flash("error", "Coupon Added");
      res.redirect("/admin/adminCoupons");
    }
  } catch (error) {
    res.status(500).json({ error: "Server Error....." });
  }
}

module.exports = {
  findCoupon,
  changeCouponCode,
  walletHistory,
  Signup,
  adminCoupons,
  deleteCoupon,
  updateCoupon,
  AddCoupon,
};
