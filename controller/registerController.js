const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db.js");
const jwt = require("../config/jwt.js");
const users = require("../model/users.js");

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", (req, res) => {
    const { email, username, password } = req.body; // AMBIL INPUT USER
  
    // PERIKSA USERNAME YANG INGIN DIDAFTARKAN OLEH USER
    users.checkUserExist(username, (error, userExist) => {
      if (error) {
        res.status(500).send("Server Error");
      } else {
        if (userExist) {
          errorMessage =
            "Username is already registered, please enter a different username.";
          res.render("register", { errorMessage }); // Render dengan pesan kesalahan
        } else {
          // FUNGSI HASHING PASSWORD DARI LIBRARY BCRYPT
          bcrypt.hash(password, 10, (error, hashedPassword) => {
            if (error) {
              res.status(500).send("Server Error");
            } else {
              // TAMBAHKAN DATA USER KE DATABASE
              users.addUser(email, username, hashedPassword, (error, result) => {
                if (error) {
                  res.status(500).send("Server Error");
                } else {
                  res.redirect("/");
                }
              });
            }
          });
        }
      }
    });
  });

module.exports = router;