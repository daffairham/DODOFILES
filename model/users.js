const db = require("../config/db.js");

// AMBIL DATA USER
const getUser = async (username) => {
  try {
    const query = `SELECT user_id, email, username FROM users WHERE username = $1`;
    const result = await db.query(query, [username]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

//AMBIL PASSWORD DARI USER
const getPassword = async (username) => {
  try {
    const query = `SELECT password FROM users WHERE username = $1`;
    const result = await db.query(query, [username]);
    return result.rows[0].password;
  } catch (error) {
    throw error;
  }
};

// FUNGSI UNTUK MENAMBAHKAN USER. DIPAKAI UNTUK REGISTRASI
const addUser = async (email, username, hashedPassword) => {
  try {
    const query = `INSERT INTO users(email, username, password) VALUES ($1, $2, $3)`;
    await db.query(query, [email, username, hashedPassword]);
  } catch (error) {
    throw error;
  }
};

// FUNGSI UNTUK MEMERIKSA APAKAH USERNAME SUDAH TERDAFTAR. DIPAKAI SAAT REGISTRASI
const checkUserExist = async (username) => {
  try {
    const query = `SELECT username FROM users WHERE username = $1`;
    const result = await db.query(query, [username]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// FUNGSI UNTUK MEMERIKSA APAKAH EMAIL SUDAH TERDAFTAR. DIPAKAI SAAT REGISTRASI
const checkEmailExist = async (email) => {
  try {
    const query = `SELECT email FROM users WHERE email = $1`;
    const result = await db.query(query, [email]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

const getUserDetailsById = async (userId) => {
  try {
    const query = `SELECT username, email FROM users WHERE user_id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

const getUserPermission = async (userId, entityId) => {
  try {
    const query = `SELECT users.user_id, users.username, users.email, shared_files.permission
                    FROM users
                    INNER JOIN shared_files
                    ON users.user_id = shared_files.user_id
                    WHERE users.user_id = $1 AND shared_files.file_id = $2`;
    const result = await db.query(query, [userId, entityId]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUser,
  getPassword,
  addUser,
  checkUserExist,
  checkEmailExist,
  getUserDetailsById,
  getUserPermission,
};
