const UserModel = require("../models/user");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const Product = require("../models/addproducts");
const OrderModel = require("../models/order");
const category = require("../models/category");

let ITEMS_PER_PAGE = 4;
// For handling file uploads

const addProductsModel = require("../models/addproducts");
const categoryModel = require("../models/category");
const order = require("../models/order");

function adminLogOut(req, res) {
  req.session.user.isAdmin = null;

  res.setHeader("Cache-Control", "no-store, max-age=0");

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/user/login");
  });
}

async function adminDeleteUser(req, res) {
  const userId = req.params.userId;

  try {
    // Find the user by ID and remove it from the database
    await UserModel.findByIdAndRemove(userId);

    // Redirect back to the admin page after deleting the user
    res.redirect("/admin/");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.redirect("/admin/");
  }
}

async function adminUpdateUser(req, res) {
  const userId = req.params.userId;
  const { firstname, lastname, email, contactnumber, password, isAdmin } =
    req.body;

  try {
    // Find the user by ID
    const user = await UserModel.findById(userId);

    if (!user) {
      console.error("User not found.");
      return res.redirect("/admin/");
    }

    // Update the user's information if fields are provided
    if (firstname) {
      user.firstname = firstname;
    }
    if (lastname) {
      user.lastname = lastname;
    }
    if (email) {
      user.email = email;
    }
    if (password) {
      const hashedPsw = await bcrypt.hash(password, 12);
      user.password = hashedPsw; // You should hash the password in production
    }

    // Save the updated user to the database
    await user.save();

    // Redirect back to the admin page after updating the user
    res.redirect("/admin/");
  } catch (error) {
    console.error("Error updating user:", error);
    res.redirect("/admin");
  }
}

async function adminAddUser(req, res) {
  const { firstname, lastname, email, contactnumber, password, isAdmin } =
    req.body;

  let user = await UserModel.findOne({ email });

  if (user) {
    return res.redirect("/login");
  }
  const hashedPsw = await bcrypt.hash(password, 12);

  // Create a new user document
  const newUser = new UserModel({
    firstname,
    lastname,
    email,
    contactnumber,
    password: hashedPsw,
    isAdmin: false,
  });

  try {
    // Save the new user to the database
    await newUser.save();

    // Redirect back to the admin page after adding the user
    res.redirect("/admin/");
  } catch (error) {
    console.error("Error adding user:", error);
    res.redirect("/admin/");
  }
}
function checkAdminAuthenticated(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.redirect("/user/login");
}

async function addProducts(req, res) {
  const categories = await categoryModel.find();
  const successMessage = req.flash("success");
  res.render("addproducts", { successMessage: successMessage, categories });
  // if (req.session.user.isActive) {

  // } else {
  //   res.send("you are not a admin");
  // }
}

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

async function postAddProducts(req, res) {
  try {
    // Extract form data
    const {
      productName,
      productCategory,
      productPrice,
      productStock,
      productdescription,
      productOffer,
    } = req.body;

    const productImages = req.files.map((file) => `/${file.filename}`);

    // Create a new product
    const newProduct = new addProductsModel({
      productName,
      productCategory,
      productPrice,
      productStock,
      productImages,
      storage,
      productOffer,
      discription: productdescription,
    });

    await newProduct.save();
    req.flash("success", "Product Added Succesfully");
    res.redirect("/admin/add-product");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}

// async function adminProduct(req, res) {
//   try {
//     if (req.session.user.isAdmin) {
//       const products = await addProductsModel.find();
//       res.render("adminproductpage", { products });
//     } else {
//       res.send("you are not a admin");
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }
async function adminProduct(req, res) {
  try {
    if (req.session.user.isAdmin) {
      const page = parseInt(req.query.page) || 1;

      const skip = (page - 1) * ITEMS_PER_PAGE;

      const products = await addProductsModel
        .find()
        .skip(skip)
        .limit(ITEMS_PER_PAGE);

      const totalProductsCount = await addProductsModel.countDocuments();

      const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
      // if (page > 1) {
      //   number = ITEMS_PER_PAGE * page;
      // } else {
      //   number = 1;
      // }
      const number = (page - 1) * ITEMS_PER_PAGE + 1;
      res.render("adminproductpage", {
        products,
        currentPage: page,
        totalPages,
        number,
      });
    } else {
      res.send("You are not an admin");
    }
  } catch (error) {
    console.log(error);
  }
}
async function adminCategories(req, res) {
  try {
    if (req.session.user.isAdmin) {
      const categories = await categoryModel.find();
      if (categories) {
        res.render("adminCategories", { categories });
      }
    } else {
      res.send("you are not a admin");
    }
  } catch (error) {
    console.log(error);
  }
}

async function postAdminCategories(req, res) {
  try {
    const { categoryName, isActive, discountpercentage } = req.body;
    const category = await categoryModel.findOne({
      categoryName: categoryName,
    });
    console.log(category);
    if (category) {
      res.redirect("/admin/adminCategories");
    } else {
      const newCategory = new categoryModel({
        categoryName,
        isActive,
        discountpercentage,
      });
      await newCategory.save();
      res.redirect("/admin/adminCategories");
    }
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}

async function adminDeleteCategories(req, res) {
  const categoryId = req.params.categoryId;

  try {
    await categoryModel.findOneAndUpdate(
      { _id: categoryId },
      { isActive: "NotActive" }
    );

    res.redirect("/admin/adminCategories");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.redirect("/admin/adminCategories");
  }
}

async function adminUpdateCategories(req, res) {
  const categoryId = req.params.categoryId;
  const { categoryName, isActive, discountpercentage } = req.body;
  try {
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      console.error("category not found.");
      return res.redirect("/admin/adminCategories");
    }

    if (categoryName) {
      category.categoryName = categoryName;
    }
    if (isActive) {
      category.isActive = isActive;
    }
    if (discountpercentage) {
      category.discountpercentage = discountpercentage;
    }

    await category.save();

    res.redirect("/admin/adminCategories");
  } catch (error) {
    console.error("Error updating Category:", error);
    res.redirect("/admin/adminCategories");
  }
}

async function adminDeleteProducts(req, res) {
  const productId = req.params.productId;
  const { status } = req.body;

  try {
    const product = await Product.findOneAndUpdate(
      { _id: productId },
      { isActive: !status }
    );

    res.status(200).json({ message: "success", productId, status: !status });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.redirect("/admin/adminproduct");
  }
}

async function search(req, res) {
  try {
    if (req.session.user.isAdmin) {
      const query = req.query.query;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * ITEMS_PER_PAGE;

      if (!query) {
        return res.status(400).json({ error: "Invalid search query" });
      }

      const searchResults = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product name
          { productCategory: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product description
        ],
      })
        .skip(skip)
        .limit(ITEMS_PER_PAGE);

      //total pages
      const totalProductsCount = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product name
          { productCategory: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product description
        ],
      }).countDocuments();

      const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);

      res.json({
        results: searchResults,
        currentPage: page,
        totalPages,
        query,
      });
    }
  } catch (error) {
    console.error("Error performing search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function searchorder(req, res) {
  try {
    if (req.session.user.isAdmin) {
      const query = req.query.query;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * ITEMS_PER_PAGE;

      if (!query) {
        return res.status(400).json({ error: "Invalid search query" });
      }

      const searchResults = await OrderModel.find({
        $or: [
          { userName: { $regex: new RegExp(query, "i") } },
          { OrderedState: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product description
        ],
      })
        .skip(skip)
        .limit(ITEMS_PER_PAGE);

      //total pages
      const totalProductsCount = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product name
          { productCategory: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product description
        ],
      }).countDocuments();

      const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);

      // Return the search results as JSON

      res.json({
        results: searchResults,
        currentPage: page,
        totalPages,
        query,
      });
    }
  } catch (error) {
    console.error("Error performing search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
async function searchCategory(req, res) {
  try {
    if (req.session.user.isAdmin) {
      const query = req.query.query;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * ITEMS_PER_PAGE;

      if (!query) {
        return res.status(400).json({ error: "Invalid search query" });
      }

      const searchResults = await category.find({
        $or: [{ categoryName: { $regex: new RegExp(query, "i") } }],
      });

      //total pages
      const totalProductsCount = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product name
          { productCategory: { $regex: new RegExp(query, "i") } }, // Case-insensitive search for product description
        ],
      }).countDocuments();

      const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
      console.log(totalPages);
      // Return the search results as JSON

      res.json({
        results: searchResults,
        currentPage: page,
        totalPages,
        query,
      });
    }
  } catch (error) {
    console.error("Error performing search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
async function blockUser(req, res) {
  const userId = req.params.userId;
  try {
    console.log("hey");
    const user = await UserModel.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user.isBlocked);

    if (user.isBlocked) {
      user.isBlocked = false;
    } else {
      user.isBlocked = true;
    }
    // user.isBlocked = isBlocked;
    await user.save();

    res.status(200).json({ message: "User status updated successfully" });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function adminOrderdetails(req, res) {
  try {
    ITEMS_PER_PAGE = 5;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const orders = await OrderModel.find().skip(skip).limit(ITEMS_PER_PAGE);
    console.log(orders);
    const userId = orders.map((order) => order.userId);
    const users = await UserModel.find({ _id: { $in: userId } });

    const totalProductsCount = await OrderModel.find().countDocuments();
    console.log(totalProductsCount);
    const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
    const number = (page - 1) * ITEMS_PER_PAGE + 1;
    res.render("adminorderdetails", {
      users,
      orders,
      currentPage: page,
      totalPages,
      number,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateProduct(req, res) {
  try {
    const productId = req.params.id;
    const categories = await categoryModel.find();
    const product = await Product.findById({ _id: productId });
    if (!product) {
      res.status(500).json({ error: "product not found" });
    }
    req.session.updateproductId = productId;
    res.render("adminupdateproducts", { product, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
async function postUpdateProduct(req, res) {
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

    if (req.body.productdescription) {
      updateData.description = req.body.productdescription;
    }
    if (req.body.productOffer) {
      updateData.productOffer = req.body.productOffer;
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

async function updateremoveimg(req, res) {
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
}

async function dashboard(req, res) {
  try {
    const orders = await OrderModel.find();
    const products = await Product.find({}, "productName productStock");

    let totalAmount = 0;
    orders.forEach((order) => {
      if (
        order.OrderedState !== "cancelled" ||
        order.OrderedState !== "Accepted"
      ) {
        totalAmount = totalAmount + order.totalPrice;
      }
    });

    res.render("admindashboard.ejs", { totalAmount, products });
  } catch (error) {
    res.status(500).json({ message: " server error" });
  }
}

module.exports = {
  adminDeleteUser,
  adminUpdateUser,
  adminAddUser,
  checkAdminAuthenticated,
  addProducts,
  postAddProducts,
  upload,
  adminProduct,
  adminCategories,
  postAdminCategories,
  adminDeleteCategories,
  adminUpdateCategories,
  adminDeleteProducts,
  adminLogOut,
  search,
  blockUser,
  adminOrderdetails,
  updateProduct,
  postUpdateProduct,
  updateremoveimg,
  searchCategory,
  searchorder,
  dashboard,
};
