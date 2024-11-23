const db = require("../config/db.js");
const sharing = require("../model/sharingModel.js");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const saveFileToDatabase = async (
  filename,
  uploadDate,
  size,
  parent,
  fileOwner,
  uniqueFilename,
  entityLink,
  modifiedDate
) => {
  const query = `INSERT INTO filesystem_entity(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder, unique_filename, entity_link, modified_date)
                    VALUES ($1, $2, $3, $4, NULL, $5, FALSE, $6, $7, $8)
                    RETURNING file_id`;

  try {
    const result = await db.query(query, [
      filename,
      uploadDate,
      size,
      parent,
      fileOwner,
      uniqueFilename,
      entityLink,
      modifiedDate,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const uploadFile = async (file, parent, fileOwner) => {
  const uploadDate = new Date();
  const modifiedDate = new Date();
  const uniqueFilename = uuidv4();
  const fileSize = file.size;
  const entityLink = uuidv4();
  const uploadPath = path.join(__dirname, "../files", uniqueFilename);

  try {
    await fs.writeFile(uploadPath, file.data);
    const uploadedFile = await saveFileToDatabase(
      file.name,
      uploadDate,
      fileSize,
      parent,
      fileOwner,
      uniqueFilename,
      entityLink,
      modifiedDate
    );
    if (parent != null) {
      await updateModifiedDateRec(parent);
    }
    return uploadedFile;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

const getFilesInFolder = async (userId, folderId) => {
  const query = `SELECT * FROM filesystem_entity WHERE parent = $1 AND file_owner = $2 AND deleted_date IS NULL ORDER BY upload_date DESC`;
  try {
    const result = await db.query(query, [folderId, userId]);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving files in folder:", error);
    throw error;
  }
};

const getFilesInRoot = async (userId) => {
  const query = `SELECT * FROM filesystem_entity WHERE parent IS NULL AND file_owner = $1 AND deleted_date IS NULL ORDER BY upload_date DESC`;
  try {
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

const getUserFolder = async (userId) => {
  const query = `SELECT * FROM filesystem_entity WHERE file_owner = $1 AND is_folder = TRUE AND deleted_date IS NULL ORDER BY upload_date DESC`;
  try {
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

const getFolderName = async (userId, folderId) => {
  const query = `SELECT file_name FROM filesystem_entity WHERE file_id = $1 AND file_owner = $2`;
  try {
    const result = await db.query(query, [folderId, userId]);
    return result;
  } catch (error) {
    throw error;
  }
};

const downloadFile = async (filename, userId, res) => {
  const getFileQuery = `SELECT file_id, unique_filename, file_owner
                        FROM filesystem_entity
                        WHERE file_name = $1`;
  try {
    const fileResult = await db.query(getFileQuery, [filename]);
    if (fileResult.rows.length === 0) {
      return res.status(404).send("File not found.");
    }
    const fileData = fileResult.rows[0];
    const fileOwner = fileData.file_owner;
    const uniqueFilename = fileData.unique_filename;
    if (fileOwner === userId) {
      const filePath = path.join(__dirname, "..", "files", uniqueFilename);
      return res.download(filePath, filename, (err) => {
        if (err) {
          throw error;
        }
      });
    } else {
      const checkSharedAccessQuery = `SELECT * 
                                      FROM shared_files 
                                      WHERE file_id = $1 AND user_id = $2`;
      const sharedResult = await db.query(checkSharedAccessQuery, [
        fileData.file_id,
        userId,
      ]);
      if (sharedResult.rows.length === 0) {
        console.log(userId, fileData);
        return res
          .status(403)
          .send("You don't have permission to download this file.");
      } else {
        const filePath = path.join(__dirname, "..", "files", uniqueFilename);
        return res.download(filePath, filename, (err) => {
          if (err) {
            console.error("Error", err);
            return res.status(500).send("Server Error");
          }
        });
      }
    }
  } catch (err) {
    console.error("Error", err);
    return res.status(500).send("Server Error");
  }
};

const moveToBin = async (fileId, userId) => {
  const query = `UPDATE filesystem_entity SET deleted_date = $1 WHERE file_id = $2 AND file_owner = $3`;
  try {
    await db.query(query, [new Date(), fileId, userId]);
  } catch (error) {
    console.error("Error moving file to bin:", error);
    throw error;
  }
};

const getDeletedFiles = async (userId) => {
  const query = `SELECT * FROM filesystem_entity WHERE file_owner = $1 AND deleted_date IS NOT NULL ORDER BY deleted_date DESC`;
  try {
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving deleted files:", error);
    throw error;
  }
};

const restoreFromBin = async (fileId, userId) => {
  const query = `UPDATE filesystem_entity SET deleted_date = NULL WHERE file_id = $1 AND file_owner = $2`;
  try {
    await db.query(query, [fileId, userId]);
  } catch (error) {
    console.error("Error restoring file from bin:", error);
    throw error;
  }
};

const moveFile = async (userId, fileId, parent) => {
  const query = `UPDATE filesystem_entity SET parent = $1 WHERE file_id = $2 AND file_owner = $3
  RETURNING file_id, parent`;
  try {
    const result = await db.query(query, [parent, fileId, userId]);

    if (parent != null) {
      await updateModifiedDateRec(parent);
    }
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

const copyFile = async (
  fileName,
  uploadDate,
  fileSize,
  parent,
  fileOwner,
  isFolder,
  sourceUniqueName,
  entityLink,
  modifiedDate
) => {
  const uniqueName = uuidv4();
  const query = `INSERT INTO filesystem_entity(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder, unique_filename, entity_link, modified_date)
                  VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9)`;

  try {
    await db.query(query, [
      fileName,
      uploadDate,
      fileSize,
      parent || null,
      fileOwner,
      isFolder,
      uniqueName,
      entityLink,
      modifiedDate,
    ]);
    const sourcePath = path.join(__dirname, "../files", sourceUniqueName);
    const destinationPath = path.join(__dirname, "../files", uniqueName);

    await fs.copyFile(sourcePath, destinationPath);
    if (parent != null) {
      await updateModifiedDateRec(parent);
    }
  } catch (error) {
    throw error;
  }
};

const createFolder = async (
  fileName,
  uploadDate,
  parent,
  fileOwner,
  modifiedDate
) => {
  const entityLink = uuidv4();
  const query = `INSERT INTO filesystem_entity(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder, unique_filename, entity_link, modified_date)
                    VALUES ($1, $2, 0, $3, NULL, $4, TRUE, NULL, $5, $6)
                    RETURNING file_id`;
  try {
    const result = await db.query(query, [
      fileName,
      uploadDate,
      parent,
      fileOwner,
      entityLink,
      modifiedDate,
    ]);
    if (parent != null) {
      await updateModifiedDateRec(parent);
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
};

const renameEntity = async (fileId, newEntityName) => {
  const renameQuery = `UPDATE filesystem_entity SET file_name = $1, modified_date = $2 WHERE file_id = $3
                      RETURNING parent`;
  try {
    const result = await db.query(renameQuery, [
      newEntityName,
      new Date(),
      fileId,
    ]);
    await updateModifiedDateRec(fileId);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

const getEntityIdByName = async (filename) => {
  const query = `SELECT file_id FROM filesystem_entity WHERE file_name = $1`;
  try {
    const result = await db.query(query, [filename]);
    return result.rows[0];
  } catch (error) {
    console.error("Error getting entity ID by name:", error);
    throw error;
  }
};

const getEntityNameById = async (entity_id) => {
  const query = `SELECT file_name FROM filesystem_entity WHERE file_id = $1`;
  try {
    const result = await db.query(query, [entity_id]);
    return result.rows[0].file_name;
  } catch (error) {
    console.error("Error getting name", error);
    throw error;
  }
};

const getEntityDetailsByLink = async (link) => {
  const query = `SELECT * FROM filesystem_entity WHERE entity_link = $1`;
  try {
    const result = await db.query(query, [link]);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving entity details by link:", error);
    throw error;
  }
};

const getEntityDetailsById = async (entityId) => {
  const query = `SELECT * FROM filesystem_entity WHERE file_id = $1`;
  try {
    const result = await db.query(query, [entityId]);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving entity details by link:", error);
    throw error;
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

const checkEntityType = async (entityId) => {
  const query = `SELECT is_folder
                              FROM filesystem_entity
                              WHERE file_id = $1
                              `;
  try {
    const result = await db.query(query, [entityId]);
    return result.rows[0].is_folder;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const updateModifiedDate = async (entityId) => {
  const query = `UPDATE filesystem_entity SET modified_date = $1
                  WHERE file_id = $2
                  RETURNING *;`;
  try {
    const result = await db.query(query, [new Date(), entityId]);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateModifiedDateRec = async (entityId) => {
  const query = `
    WITH RECURSIVE parent_folders AS (
      SELECT file_id, parent
      FROM filesystem_entity
      WHERE file_id = $1

      UNION ALL

      SELECT filesystem_entity.file_id, filesystem_entity.parent
      FROM filesystem_entity 
      INNER JOIN parent_folders ON filesystem_entity.file_id = parent_folders.parent
    )
    SELECT file_id FROM parent_folders;
  `;

  try {
    const result = await db.query(query, [entityId]);
    const folderIds = result.rows.map((row) => row.file_id);

    for (const folderId of folderIds) {
      await updateModifiedDate(folderId);
    }
  } catch (error) {
    throw error;
  }
};

const deleteEntity = async (isFolder, entityId, owner) => {
  try {
    if (isFolder) {
      const query = `WITH RECURSIVE children_entity AS (
        SELECT file_id, unique_filename
        FROM filesystem_entity
        WHERE file_id = $1 AND file_owner = $2

        UNION

        SELECT filesystem_entity.file_id, filesystem_entity.unique_filename
        FROM filesystem_entity
        INNER JOIN children_entity ON filesystem_entity.parent = children_entity.file_id
      )
      DELETE FROM filesystem_entity
      WHERE file_id IN (SELECT file_id FROM children_entity)
      RETURNING unique_filename`;
      const result = await db.query(query, [entityId, owner]);
      for (const row of result.rows) {
        if (row.unique_filename !== null) {
          try {
            await fs.unlink(
              path.join(__dirname, "../files", row.unique_filename)
            );
          } catch (err) {
            throw err;
          }
        }
      }
    } else {
      const query = `DELETE FROM filesystem_entity
      WHERE file_id = $1 AND file_owner = $2
      RETURNING unique_filename`;
      const result = await db.query(query, [entityId, owner]);
      const deletedFileName = result.rows[0].unique_filename;
      try {
        await fs.unlink(path.join(__dirname, "../files", deletedFileName));
      } catch (err) {
        throw err;
      }
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  uploadFile,
  getFilesInFolder,
  getFilesInRoot,
  getUserFolder,
  getFolderName,
  getDeletedFiles,
  downloadFile,
  moveToBin,
  restoreFromBin,
  moveFile,
  copyFile,
  createFolder,
  renameEntity,
  getEntityIdByName,
  getEntityNameById,
  getEntityDetailsByLink,
  getEntityDetailsById,
  getChildFromParent,
  checkEntityType,
  updateModifiedDate,
  updateModifiedDateRec,
  deleteEntity,
};
