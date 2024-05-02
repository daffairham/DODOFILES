const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db.js");
const jwt = require("../config/jwt.js");
const users = require("../model/users.js");

router.get("/", (req, res) => {
  res.render("login");
});

router.get("/login", (req, res) => {
  res.redirect("/");
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  // Panggil users.getUser dengan sebuah callback untuk menangani hasil query
  users.getUser(username, (error, userData) => {
    if (error) {
      console.error("Error:", error);
      res.status(500).send("Server Error");
    } else {
      if (userData) {
        const userPassword = userData.password;
        // Membandingkan password yang diberikan dengan password yang di-hash
        bcrypt.compare(password, userPassword, (err, result) => {
          if (err) {
            console.error("Error:", err);
            res.status(500).send("Server Error");
          } else {
            if (result) {
              // Jika password cocok, hasilnya adalah true
              const token = jwt.generateToken(userData);
              req.user = userData;
              // Set cookie token dan redirect ke halaman home
              res.cookie("token", token, {
                httpOnly: true,
                secure: true,
              });
              res.redirect("/home");
              console.log(token);
            } else {
              // Jika password tidak cocok
              console.log("Invalid password");
              res.redirect("/");
            }
          }
        });
      } else {
        // Jika akun tidak terdaftar
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