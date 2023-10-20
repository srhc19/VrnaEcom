const UserModel = require("../models/user");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const Product = require("../models/addproducts");
const OrderModel = require("../models/order");

const ITEMS_PER_PAGE = 3;
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

function addProducts(req, res) {
  const successMessage = req.flash("success");
  res.render("addproducts", { successMessage: successMessage });
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
      storage,
    });

    // Save the product to the database
    await newProduct.save();
    req.flash("success", "Product Added Succesfully");
    res.redirect("/admin/add-product");
    // res.status(201).json({ message: "Product added successfully" });
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
      // Parse the page query parameter from the request
      const page = parseInt(req.query.page) || 1;

      const skip = (page - 1) * ITEMS_PER_PAGE;

      // Query the database to get a subset of products based on pagination
      const products = await addProductsModel
        .find()
        .skip(skip)
        .limit(ITEMS_PER_PAGE);

      const totalProductsCount = await addProductsModel.countDocuments();

      // Calculate the total number of pages based on the total products and items per page
      const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
      if (currentPage > 1) {
        num = ITEMS_PER_PAGE * currentPage;
      } else {
        num = 1;
      }

      res.render("adminproductpage", {
        products,
        currentPage: page,
        totalPages,
        num,
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
    const { categoryName, isActive } = req.body;
    const newCategory = new categoryModel({
      categoryName,
      isActive,
    });
    await newCategory.save();
    res.redirect("/admin/adminCategories");
  } catch (error) {
    res.status(500).json({ error: "server Error" });
  }
}

async function adminDeleteCategories(req, res) {
  const categoryId = req.params.categoryId;

  try {
    // Find the user by ID and remove it from the database
    await categoryModel.findByIdAndRemove(categoryId);

    // Redirect back to the admin page after deleting the user
    res.redirect("/admin/adminCategories");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.redirect("/admin/adminCategories");
  }
}

async function adminUpdateCategories(req, res) {
  const categoryId = req.params.categoryId;
  const { categoryName, isActive } = req.body;
  try {
    // Find the user by ID
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      console.error("category not found.");
      return res.redirect("/admin/adminCategories");
    }

    // Update the user's information if fields are provided
    if (categoryName) {
      category.categoryName = categoryName;
    }
    if (isActive) {
      category.isActive = isActive;
    }

    // console.log("Received request with updateName:", updateName);

    // Save the updated user to the database
    await category.save();

    // Redirect back to the admin page after updating the user
    res.redirect("/admin/adminCategories");
  } catch (error) {
    console.error("Error updating Category:", error);
    res.redirect("/admin/adminCategories");
  }
}

async function adminDeleteProducts(req, res) {
  const productId = req.params.productId;

  try {
    // Find the user by ID and remove it from the database
    await addProductsModel.findByIdAndRemove(productId);

    // Redirect back to the admin page after deleting the user
    res.redirect("/admin/adminproduct");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.redirect("/admin/adminproduct");
  }
}

async function search(req, res) {
  try {
    if (req.session.user.isAdmin) {
      const query = req.query.query; // user's search query
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * ITEMS_PER_PAGE;
      console.log(req.query.page);
      console.log(query);

      console.log(skip);
      // Check if the query is empty or undefined
      if (!query) {
        return res.status(400).json({ error: "Invalid search query" });
      }

      // Perform a case-insensitive search using regular expressions
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
    console.log("hey");
    const orders = await OrderModel.find();
    const userId = orders.map((order) => order.userId);
    const users = await UserModel.find({ _id: { $in: userId } });

    console.log(orders);
    console.log(userId);
    console.log(users);
    res.render("adminorderdetails", { users, orders });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
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
};
