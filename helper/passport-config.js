const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email);
    if (user == null) {
      return done(null, false, { message: "No user with that email" });
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { messages: "Password incorrect" });
      }
    } catch (e) {
      return done(e);
    }
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));

  passport.serializeUser((user, done) => {
    // Serialize user object into session
    done(null, user.id); // Assuming user has an "id" property
  });

  passport.deserializeUser((id, done) => {
    // Deserialize user from session
    const user = getUserById(id);
    done(null, user); // Assuming user object is retrieved by ID
  });
}

module.exports = initialize;
