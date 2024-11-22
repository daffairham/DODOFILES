const { download } = require("express/lib/response.js");
const db = require("../config/db.js");
const fileModel = require("./files.js");

const getSharedFiles = async (userId) => {
  try {
    const query = `
      WITH RECURSIVE shared_entities AS (
        SELECT 
          filesystem_entity.file_id,
          filesystem_entity.file_name,
          filesystem_entity.upload_date,
          filesystem_entity.size,
          filesystem_entity.parent,
          filesystem_entity.deleted_date,
          filesystem_entity.file_owner,
          filesystem_entity.is_folder,
          filesystem_entity.unique_filename,
          filesystem_entity.entity_link,
          filesystem_entity.modified_date
        FROM shared_files
        INNER JOIN filesystem_entity ON shared_files.file_id = filesystem_entity.file_id
        WHERE shared_files.user_id = $1

        UNION

        SELECT 
          filesystem_entity.file_id,
          filesystem_entity.file_name,
          filesystem_entity.upload_date,
          filesystem_entity.size,
          filesystem_entity.parent,
          filesystem_entity.deleted_date,
          filesystem_entity.file_owner,
          filesystem_entity.is_folder,
          filesystem_entity.unique_filename,
          filesystem_entity.entity_link,
          filesystem_entity.modified_date
        FROM filesystem_entity 
        INNER JOIN shared_entities ON filesystem_entity.parent = shared_entities.file_id
      )
      SELECT * FROM shared_entities WHERE parent IS NULL AND deleted_date IS NULL;
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

const getSharedFolderFiles = async (userId, parent) => {
  try {
    const query = `SELECT * FROM shared_files 
                   INNER JOIN filesystem_entity 
                   ON shared_files.file_id = filesystem_entity.file_id
                   WHERE user_id = $1 AND parent = $2`;
    const result = await db.query(query, [userId, parent]);
    return result.rows;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

const checkPermissionExist = async (userId, entityId) => {
  try {
    const query = `SELECT user_id, permission FROM shared_files WHERE user_id = $1 AND file_id = $2`;
    const result = await db.query(query, [userId, entityId]);
    return result.rows;
  } catch (err) {
    throw err;
  }
};

const grantPermission = async (userId, folderId, permission) => {
  try {
    const query = `
      WITH RECURSIVE folder_entities AS (
        SELECT 
          filesystem_entity.file_id
        FROM filesystem_entity
        WHERE file_id = $1

        UNION ALL

        SELECT 
          filesystem_entity.file_id
        FROM filesystem_entity 
        INNER JOIN folder_entities ON filesystem_entity.parent = folder_entities.file_id
      )
      SELECT file_id FROM folder_entities;
    `;

    const result = await db.query(query, [folderId]);
    const entityIds = result.rows.map((row) => row.file_id);

    for (const entityId of entityIds) {
      const insertQuery = `
        INSERT INTO shared_files (user_id, file_id, permission)
        SELECT $1, $2, $3
        WHERE NOT EXISTS (
          SELECT 1 FROM shared_files WHERE user_id = $1 AND file_id = $2
        )
      `;
      await db.query(insertQuery, [userId, entityId, permission]);
    }
  } catch (err) {
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
      console.log("User Not Found");
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
    throw err;
  }
};

const removeAccessFromOwner = async (user_id, entity_id) => {
  try {
    const query = `DELETE FROM shared_files
                    USING filesystem_entity
                    WHERE shared_files.file_id = filesystem_entity.file_id
                    AND shared_files.user_id = $1
                    AND filesystem_entity.id = $2`;
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
                    AND filesystem_entity.file_id = $2`;
    const result = await db.query(query, [user_id, entity_id]);
    return result.rows;
  } catch (err) {
    throw err;
  }
};

const getChildFromParent = async (parent) => {
  const query = `SELECT file_id 
                  FROM filesystem_entity
                  WHERE filesystem_entity.parent = $1
                              `;
  try {
    const result = await db.query(query, [parent]);
    return result.rows;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

const handleNewUpload = async (fileId, parent, userId) => {
  try {
    const sharedUsers = await getSharedUsers(parent);
    const userIds = sharedUsers.map((user) => user.user_id);

    for (let i = 0; i < userIds.length; i++) {
      const checkPermission = await checkPermissionExist(userIds[i], parent);
      if (checkPermission.length > 0) {
        await grantPermission(
          userIds[i],
          fileId,
          checkPermission[0].permission
        );
      } else {
        console.log(`No access`);
      }
    }
  } catch (error) {
    throw error;
  }
};

const changePermission = async (permission, userId, entityId) => {
  const query = `UPDATE shared_files SET permission = $1
                  WHERE user_id = $2 AND file_id = $3
                  RETURNING file_id`;
  try {
    const result = await db.query(query, [permission, userId, entityId]);
    return result.rows[0];
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

module.exports = {
  grantPermission,
  saveSharedLink,
  getSharedFiles,
  getSharedFolderFiles,
  getUserIdToShare,
  checkPermissionExist,
  getSharedUsers,
  removeSharedAccess,
  removeAccessFromOwner,
  handleNewUpload,
  fileModel,
  getChildFromParent,
  changePermission,
};
