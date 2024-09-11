const { download } = require("express/lib/response.js");
const db = require("../config/db.js");

const getSharedFiles = async (userId) => {
  try {
    const query = `SELECT * FROM shared_files 
                   INNER JOIN filesystem_entity 
                   ON shared_files.file_id = filesystem_entity.file_id
                   WHERE user_id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

const checkPermissionExist = async (userId, entityId) => {
  try {
    const query = `SELECT * FROM shared_files WHERE user_id = $1 AND file_id = $2`;
    const result = await db.query(query, [userId, entityId]);
    return result.rows;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

const grantPermission = async (userId, entityId, permission) => {
  try {
    const query = `
      INSERT INTO shared_files (user_id, file_id, permission)
      SELECT $1, $2, $3
      WHERE NOT EXISTS (
        SELECT 1 FROM shared_files WHERE user_id = $1 AND file_id = $2
      )`;
    const result = await db.query(query, [userId, entityId, permission]);
    return result;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

const getUserIdToShare = async (email) => {
  try {
    const query = `
      SELECT user_id
      FROM users
      WHERE email = $1`;
    const result = await db.query(query, [email]);
    if (result.rows.length > 0) {
      return result.rows[0].user_id;
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

const saveSharedLink = async (permissionId, sharedLink) => {
  try {
    const query = "UPDATE shared_file SET shared_link = $1 WHERE id = $2";
    const result = await db.query(query, [sharedLink, permissionId]);
    return result;
  } catch (err) {
    console.error("Error saving shared link:", err);
    throw err;
  }
};

const getSharedUsers = async (entity_id) => {
  try {
    const query = `SELECT shared_files.user_id, shared_files.file_id, file_name, username, email, permission 
                    FROM shared_files 
                    INNER JOIN filesystem_entity
                    ON shared_files.file_id = filesystem_entity.file_id
                    INNER JOIN users
                    ON shared_files.user_id = users.user_id
                    WHERE shared_files.file_id = $1`;
    const result = await db.query(query, [entity_id]);
    return result.rows;
  } catch (err) {
    console.error("Error getting shared users:", err);
    throw err;
  }
};

const removeAccessFromOwner = async (user_id, entity_id) => {
  try {
    const query = `DELETE FROM shared_files
                    USING filesystem_entity
                    WHERE shared_files.file_id = filesystem_entity.file_id
                    AND shared_files.user_id = $1
                    AND filesystem_entity.file_name = $2`;
    const result = await db.query(query, [user_id, entity_id]);
    return result.rows;
  } catch (err) {
    console.error("Error getting shared users:", err);
    throw err;
  }
};

const removeSharedAccess = async (user_id, entity_id) => {
  try {
    const query = `DELETE FROM shared_files
                    USING filesystem_entity
                    WHERE shared_files.file_id = filesystem_entity.file_id
                    AND shared_files.user_id = $1
                    AND filesystem_entity.file_name = $2`;
    const result = await db.query(query, [user_id, entity_id]);
    return result.rows;
  } catch (err) {
    console.error("Error getting shared users:", err);
    throw err;
  }
};

const downloadSharedFile = async (filename, userId, res) => {
  const query = `SELECT * FROM filesystem_entity WHERE file_name = $1 AND file_owner = $2 AND deleted_date IS NULL`;
  try {
    const result = await db.query(query, [filename, userId]);
    if (result.rows.length > 0) {
      const file = result.rows[0];
      const filePath = path.join(__dirname, "../files", file.unique_filename);
      res.download(filePath, filename);
    } else {
      res.status(404).send("File not found");
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

module.exports = {
  grantPermission,
  saveSharedLink,
  getSharedFiles,
  getUserIdToShare,
  checkPermissionExist,
  getSharedUsers,
  removeSharedAccess,
  removeAccessFromOwner,
  downloadSharedFile
};
