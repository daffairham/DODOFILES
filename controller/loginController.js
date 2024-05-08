const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db.js");
const jwt = require("../config/jwt.js");
const users = require("../model/users.js");

router.get("/", jwt.authenticate, (req, res) => {
  res.render("login");
});

router.get("/login", (req, res) => {
  res.redirect("/");
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  users.getUser(username, (error, userData) => {
    if (error) {
      console.error("Error:", error);
      res.status(500).send("Server Error");
    } else {
      if (userData) {
        const userPassword = userData.password;
        bcrypt.compare(password, userPassword, (err, result) => {
          if (err) {
            console.error("Error:", err);
            res.status(500).send("Server Error");
          } else {
            if (result) {
              const token = jwt.generateToken(userData);
              req.user = userData;
              res.cookie("token", token, {
                httpOnly: true,
                secure: true,
              });
              res.redirect("/home");
            } else {
              console.log("Invalid password");
              res.redirect("/");
            }
          }
        });
      } else {
        console.log("Account not registered");
        res.redirect("/");
      }
    }
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;