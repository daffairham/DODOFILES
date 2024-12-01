const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("../config/jwt.js");
const users = require("../model/users.js");

router.get("/", jwt.authenticate, (req, res) => {
  res.render("login", { serverMessage: "" });
});

router.get("/sign-in", jwt.authenticate, (req, res) => {
  res.redirect("/");
});

router.post("/sign-in", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userData = await users.getUser(username);
    if (userData) {
      const passwordFromDB = await users.getPassword(username);
      const isMatch = await bcrypt.compare(password, passwordFromDB);
      if (isMatch) {
        const token = jwt.generateToken(userData);
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
        });
        res.redirect("/home");
      } else {
        res.render("login", { serverMessage: "Password is incorrect." });
      }
    } else {
      res.render("login", { serverMessage: "Account is not registered." });
    }
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
