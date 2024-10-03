const db = require("../config/db.js");

// AMBIL DATA USER
const getUser = async (username) => {
  try {
    const QUERY = `SELECT * FROM users WHERE username = $1`;
    const { rows } = await db.query(QUERY, [username]);
    return rows[0];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// FUNGSI UNTUK MENAMBAHKAN USER. DIPAKAI UNTUK REGISTRASI
const addUser = async (email, username, hashedPassword) => {
  try {
    const QUERY = `INSERT INTO users(email, username, password) VALUES ($1, $2, $3)`;
    await db.query(QUERY, [email, username, hashedPassword]);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// FUNGSI UNTUK MEMERIKSA APAKAH USERNAME SUDAH TERDAFTAR. DIPAKAI SAAT REGISTRASI
const checkUserExist = async (username) => {
  try {
    const QUERY = `SELECT username FROM users WHERE username = $1`;
    const { rows } = await db.query(QUERY, [username]);
    return rows[0];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getUserDetailsById = async (userId) => {
  try {
    const QUERY = `SELECT username, email FROM users WHERE user_id = $1`;
    const { rows } = await db.query(QUERY, [userId]);
    return rows[0];
  } catch (error) {
    console.error("Error:", error);
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

module.exports = { getUser, addUser, checkUserExist, getUserDetailsById, getUserPermission };
