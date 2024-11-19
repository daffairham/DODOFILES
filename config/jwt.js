const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_KEY;

//FUNGSI UNTUK MEMBUAT TOKEN JWT
const generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: "10h" });
};

//FUNGSI UNTUK PERIKSA TOKEN JWT YANG DIHASILKAN
const verifyToken = (token) => {
  return jwt.verify(token, secretKey);
};

const getIdFromToken = (token) => {
  return verifyToken(token).user_id;
};

const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  try {
    const verify = await verifyToken(token);
    req.user = verify;
    if (req.originalUrl === "/" && req.user) {
      return res.redirect("/home");
    }
    next();
  } catch (error) {
    res.clearCookie("token");
    if (req.originalUrl === "/home") {
      return res.redirect("/");
    }
    next();
  }
};

module.exports = { generateToken, verifyToken, authenticate, getIdFromToken };
