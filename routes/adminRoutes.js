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

router.get("/update/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById({ _id: productId });
    if (!product) {
      res.status(500).json({ error: "product not found" });
    }
    req.session.updateproductId = productId;
    res.render("adminupdateproducts", { product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/updateProduct/:id",
  adminController.upload.array("images[]", 10),
  async (req, res) => {
    try {
      const productId = req.params.id;

      // Find the existing product by its ID
      let existingProduct = await Product.findById(productId);

      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Construct an update object based on request data
      const updateData = {};
      if (req.body.productName) {
        updateData.productName = req.body.productName;
      }
      if (req.body.productCategory) {
        updateData.productCategory = req.body.productCategory;
      }
      if (req.body.productPrice) {
        updateData.productPrice = req.body.productPrice;
      }
      if (req.body.productStock) {
        updateData.productStock = req.body.productStock;
      }
      if (req.files && req.files.length > 0) {
        updateData.$push = {
          productImages: {
            $each: req.files.map((file) => `/${file.filename}`),
          },
        };
      }

      // Update the product with the new data
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true }
      );

      // Assuming you have successfully updated the product
      req.flash("success", "Product Updated Successfully");
      res.redirect("/admin/adminproduct");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/update/removeimg/:index", async (req, res) => {
  try {
    const index = req.params.index;
    const productId = req.session.updateproductId;

    const product = await Product.findById({ _id: productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (index >= 0 && index < product.productImages.length) {
      product.productImages.splice(index, 1);

      await Product.findByIdAndUpdate(productId, {
        productImages: product.productImages,
      });
    }
    res.redirect(`/admin/update/${productId}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

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
