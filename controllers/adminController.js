const UserModel = require("../models/user");
const bcrypt = require("bcrypt");

async function adminDeleteUser(req, res) {
  const userId = req.params.userId;

  try {
    // Find the user by ID and remove it from the database
    await UserModel.findByIdAndRemove(userId);

    // Redirect back to the admin page after deleting the user
    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.redirect("/admin");
  }
}

async function adminUpdateUser(req, res) {
  const userId = req.params.userId;
  const { updateName, updateEmail, updatePassword } = req.body;

  try {
    // Find the user by ID
    const user = await UserModel.findById(userId);

    if (!user) {
      console.error("User not found.");
      return res.redirect("/admin");
    }

    // Update the user's information if fields are provided
    if (updateName) {
      user.name = updateName;
    }
    if (updateEmail) {
      user.email = updateEmail;
    }
    if (updatePassword) {
      const hashedPsw = await bcrypt.hash(updatePassword, 12);
      user.password = hashedPsw; // You should hash the password in production
    }
    console.log("Received request with updateName:", updateName);

    // Save the updated user to the database
    await user.save();

    // Redirect back to the admin page after updating the user
    res.redirect("/admin");
  } catch (error) {
    console.error("Error updating user:", error);
    res.redirect("/admin");
  }
}

async function adminAddUser(req, res) {
  const { name, email, password, isAdmin } = req.body;

  let user = await UserModel.findOne({ email });

  if (user) {
    return res.redirect("/login");
  }
  const hashedPsw = await bcrypt.hash(password, 12);

  // Create a new user document
  const newUser = new UserModel({
    name,
    email,
    password: hashedPsw,
    isAdmin: false,
  });

  try {
    // Save the new user to the database
    await newUser.save();

    // Redirect back to the admin page after adding the user
    res.redirect("/admin");
  } catch (error) {
    console.error("Error adding user:", error);
    res.redirect("/admin");
  }
}
function checkAdminAuthenticated(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.redirect("/login");
}

module.exports = {
  adminDeleteUser,
  adminUpdateUser,
  adminAddUser,
  checkAdminAuthenticated,
};
