const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const users = require("../model/users.js");
const jwt = require("../config/jwt.js");

router.get("/register", jwt.authenticate, (req, res) => {
  res.render("register", { serverMessage: "" });
});

router.post("/register", async (req, res) => {
  const { email, username, password } = req.body; // AMBIL INPUT USER

  try {
    // PERIKSA USERNAME DAN EMAIL YANG INGIN DIDAFTARKAN OLEH USER
    const userExist = await users.checkUserExist(username);
    const emailExist = await users.checkEmailExist(email);
    if (userExist.length > 0 || emailExist.length > 0) {
      res.render("register", {serverMessage: "Username or email is already taken. Please try again."})
    } else {
      // FUNGSI HASHING PASSWORD DARI LIBRARY BCRYPT
      const hashedPassword = await bcrypt.hash(password, 10);

      // TAMBAHKAN DATA USER KE DATABASE
      await users.addUser(email, username, hashedPassword);
      // MASUKKAN TOKEN JWT, DAN ALIHKAN USER KE HOMEPAGE
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
        }
      }
    }
  } catch (error) {
    res.status(500).send("Server Error");
    throw error;
  }
});

router.post("/checkEmail", async (req, res) => {
  const emailInput = req.body.email;
  try {
    const email = await users.checkEmailExist(emailInput);
    if (email.length === 0) {
      res.send(`<span class="text-green-500">Email is available.</span>`);
    } else {
      res.send(`<span class="text-red-500">Email is already taken.</span>`);
    }
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

router.post("/checkUsername", async (req, res) => {
  const usernameInput = req.body.username;
  try {
    const username = await users.checkUserExist(usernameInput);
    if (username.length === 0) {
      res.send(`<span class="text-green-500">Username is available.</span>`);
    } else {
      res.send(`<span class="text-red-500">Username is already taken.</span>`);
    }
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
