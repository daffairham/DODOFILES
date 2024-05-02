const jwt = require('jsonwebtoken')

const secretKey = "inikunci";

//FUNGSI UNTUK MEMBUAT TOKEN JWT
const generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: "10h" });
};

//FUNGSI UNTUK PERIKSA TOKEN JWT YANG DIHASILKAN
const verifyToken = (token) => {
  return jwt.verify(token, secretKey);
};

const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  try {
    const verify = await verifyToken(token);
    req.user = verify;
    next();
  } catch (error) {
    res.clearCookie("token");
    res.redirect("/");
  }
};

module.exports = {generateToken, verifyToken, authenticate};