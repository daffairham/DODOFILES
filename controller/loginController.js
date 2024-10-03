const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db.js");
const jwt = require("../config/jwt.js");
const users = require("../model/users.js");

router.get("/", jwt.authenticate, (req, res) => {
  res.render("login");
});

router.get("/sign-in", jwt.authenticate, (req, res) => {
  res.redirect("/");
});

router.post("/sign-in", async (req, res) => {
  const { username, password } = req.body;
  let serverMessage = '';
  try {
    const userData = await users.getUser(username);
    if (userData) {
      const userPassword = userData.password;
      const isMatch = await bcrypt.compare(password, userPassword);
      if (isMatch) {
        const token = jwt.generateToken(userData);
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
        });
        res.redirect("/home");
      } else {
        console.log("Invalid password");
        res.redirect("/");
      }
    } else {
      res.send(`<span class="text-red-500">Account not registered</span>`)
      // serverMessage = "Account not registered.";
      // res.render("login", {serverMessage});
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
