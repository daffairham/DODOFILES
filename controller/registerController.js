const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const users = require("../model/users.js");

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  const { email, username, password } = req.body; // AMBIL INPUT USER

  try {
    // PERIKSA USERNAME YANG INGIN DIDAFTARKAN OLEH USER
    const userExist = await users.checkUserExist(username);
    if (userExist) {
      const errorMessage = "Username is already registered, please enter a different username.";
      return res.render("register", { errorMessage }); // Render dengan pesan kesalahan
    }

    // FUNGSI HASHING PASSWORD DARI LIBRARY BCRYPT
    const hashedPassword = await bcrypt.hash(password, 10);

    // TAMBAHKAN DATA USER KE DATABASE
    await users.addUser(email, username, hashedPassword);
    res.redirect("/");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
