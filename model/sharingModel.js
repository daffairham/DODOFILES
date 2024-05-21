const db = require("../config/db.js");

const getSharedFiles = (userId, callback) => {
  const query = `select * from shared_files 
                    INNER JOIN filesystem_entity 
                    ON shared_files.file_id = filesystem_entity.file_id
                    WHERE user_id = $1`;
  db.query(query, [userId], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, res.rows);
    }
  });
};

const checkPermissionExist = (userId, entityId, callback) => {
  const query = `SELECT * FROM shared_files WHERE user_id = $1 AND file_id = $2`;
  db.query(query, [userId, entityId], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, res.rows);
    }
  });
};

const grantPermission = (userId, entityId, permission, callback) => {
  const query = `
    INSERT INTO shared_files (user_id, file_id, permission)
    SELECT $1, $2, $3
    WHERE NOT EXISTS (
      SELECT 1 FROM shared_files WHERE user_id = $1 AND file_id = $2
    )`;

  db.query(query, [userId, entityId, permission], (err, result) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};

const getUserIdToShare = (email, callback) => {
  const query = `
    SELECT user_id
    FROM users
    WHERE email = $1`;

  db.query(query, [email], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result.rows[0].user_id);
    }
  });
};

const saveSharedLink = (permissionId, sharedLink, callback) => {
  const query = "UPDATE shared_file SET shared_link = $1 WHERE id = $2";
  db.query(query, [sharedLink, permissionId], (err, result) => {
    if (err) {
      console.error("Error saving shared link:", err);
      callback(err);
    } else {
      callback(null);
    }
  });
};

module.exports = {
  grantPermission,
  saveSharedLink,
  getSharedFiles,
  getUserIdToShare,
  checkPermissionExist
};
