if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const nocache = require("nocache");
const bodyParser = require("body-parser");
// const logger = require("morgan");
app.use(nocache());
// app.use(logger());
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
require("dotenv").config();
//helper
const initializePassport = require("./helper/passport-config");

const dbURI = process.env.mongodb;

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
    saveUninitialized: false,
    resave: false,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/user", userRoutes);

// const { redirectRouter } = require("./controllers/usercontrollers");
// app.get("/", redirectRouter);

const otpRoutes = require("./routes/otpRoutes");
app.use("/otp", otpRoutes);
app.use((req, res, next) => {
  res.status(404).render("error");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(404).render("error");
});

app.listen(3000);
