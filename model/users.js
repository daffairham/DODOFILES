const db = require("../config/db.js");

// AMBIL DATA USER
const getUser = (username, callback) => {
  const QUERY = `SELECT * FROM users WHERE username = $1`;
  db.query(QUERY, [username], (error, results) => {
    if (error) {
      console.error("Error:", error);
      callback(error, null);
    } else {
      callback(null, results.rows[0]);
    }
  });
};

// FUNGSI UNTUK MENAMBAHKAN USER. DIPAKAI UNTUK REGISTRASI
const addUser = (email, username, hashedPassword, callback) => {
  const QUERY = `INSERT INTO users(email, username, password) VALUES ($1, $2, $3)`;
  db.query(QUERY, [email, username, hashedPassword], (error, results) => {
    if (error) {
      console.error("Error:", error);
      callback(error, null);
    } else {
      callback(null, results);
    }
  });
};

// FUNGSI UNTUK MEMERIKSA APAKAH USERNAME SUDAH TERDAFTAR. DIPAKAI SAAT REGISTRASI
const checkUserExist = (username, callback) => {
  const QUERY = `SELECT username FROM users WHERE username = $1`;
  db.query(QUERY, [username], (error, results) => {
    if (error) {
      console.error("Error:", error);
      callback(error, null);
    } else {
      callback(null, results.rows[0]);
    }
  });
};

module.exports = { getUser, addUser, checkUserExist };
