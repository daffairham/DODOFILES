const db = require("../config/db.js");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const saveFileToDatabase = (
  filename,
  uploadDate,
  size,
  parent,
  fileOwner,
  uniqueFilename,
  entityLink,
  callback
) => {
  const query = `INSERT INTO filesystem_entity(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder, unique_filename, entity_link)
                    VALUES ($1, $2, $3, $4, NULL, $5, FALSE, $6, $7)`;

  db.query(
    query,
    [filename, uploadDate, size, parent, fileOwner, uniqueFilename, entityLink],
    (error, result) => {
      if (error) {
        console.error("Error:", error);
        callback(error, null);
      } else {
        callback(null, result);
      }
    }
  );
};

const uploadFile = (file, parent, fileOwner, callback) => {
  const fileName = file.name;
  const uniqueFilename = uuidv4();
  const filePath = path.join(__dirname, "..", "files", uniqueFilename);

  fs.writeFile(filePath, file.data, (err) => {
    if (err) {
      callback(err);
    } else {
      console.log("Uploaded into: " + filePath);
      saveFileToDatabase(
        fileName,
        new Date(),
        file.size,
        parent,
        fileOwner,
        uniqueFilename,
        uuidv4(),
        callback
      );
    }
  });
};

const downloadFile = (fileName, userId, res) => {
  const getFileQuery = `SELECT file_id, unique_filename, file_owner
                        FROM filesystem_entity
                        WHERE file_name = $1`;
  db.query(getFileQuery, [fileName], (err, fileResult) => {
    if (err) {
      console.error("Error:", err);
      res.status(500).send("Internal Server Error");
    } else if (fileResult.rows.length === 0) {
      res.status(404).send("File not found.");
    } else {
      const fileData = fileResult.rows[0];
      const fileOwner = fileData.file_owner;
      const uniqueFilename = fileData.unique_filename;

      if (fileOwner === userId) {
        const filePath = path.join(__dirname, "..", "files", uniqueFilename);
        res.download(filePath, fileName, (err) => {
          if (err) {
            console.error("Error:", err);
            res.status(500).send("Internal Server Error");
          }
        });
      } else {
        const checkSharedAccessQuery = `SELECT * 
                                  FROM shared_files 
                                  WHERE file_id = $1 AND user_id = $2`;
        db.query(
          checkSharedAccessQuery,
          [fileData.file_id, userId],
          (err, sharedResult) => {
            if (err) {
              console.error("Error:", err);
              res.status(500).send("Internal Server Error");
            } else if (sharedResult.rows.length === 0) {
              console.log(userId, fileData);
              res
                .status(403)
                .send("You don't have permission to download this file.");
            } else {
              const filePath = path.join(
                __dirname,
                "..",
                "files",
                uniqueFilename
              );
              res.download(filePath, fileName, (err) => {
                if (err) {
                  console.error("Error:", err);
                  res.status(500).send("Internal Server Error");
                }
              });
            }
          }
        );
      }
    }
  });
};

const createFolder = (filename, uploadDate, parent, fileOwner, callback) => {
  const query = `INSERT INTO filesystem_entity(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder, unique_filename)
                    VALUES ($1, $2, 0, $3, NULL, $4, TRUE, NULL)`;

  db.query(
    query,
    [filename, uploadDate, parent, fileOwner],
    (error, result) => {
      if (error) {
        console.error("Error:", error);
        callback(error, null);
      } else {
        console.log("File berhasil disimpan ke database");
        callback(null, result);
      }
    }
  );
};

const getFilesInRoot = (userId, callback) => {
  const query = `SELECT * 
                FROM filesystem_entity
                WHERE file_owner = $1 AND deleted_date IS NULL AND parent IS NULL`;
  db.query(query, [userId], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, res.rows);
    }
  });
};

const getFilesInFolder = (userId, folder, callback) => {
  const query = `SELECT * 
                FROM filesystem_entity
                WHERE file_owner = $1 AND parent = $2 AND deleted_date IS NULL`;
  db.query(query, [userId, folder], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, res.rows);
    }
  });
};

const getDeletedFiles = (userId, callback) => {
  const query = `SELECT * 
                FROM filesystem_entity
                WHERE file_owner = $1 AND deleted_date IS NOT NULL`;
  db.query(query, [userId], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, res.rows);
    }
  });
};

const moveToBin = (fileName, ownerId, callback) => {
  const query = `UPDATE filesystem_entity
                  SET deleted_date = CURRENT_DATE
                  WHERE file_name = '${fileName}' AND file_owner = $1`;
  db.query(query, [ownerId], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      const message = ``;
      callback(null, message);
    }
  });
};

const moveFile = (userId, filename, parent, callback) => {
  const query = `UPDATE filesystem_entity SET parent = $1 WHERE file_name = $2 AND file_owner = $3`;
  db.query(query, [parent || null, filename, userId], (err, result) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      console.log("File moved successfully");
      callback(null, result);
    }
  });
};

const copyFile = (fileName, uploadDate, fileSize, parentID, fileOwner, isFolder, uniqueName, entityLink, sourceFilename, callback) => {
  const query = `INSERT INTO filesystem_entity(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder, unique_filename, entity_link)
                  VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8)`;
  db.query(query, [fileName, uploadDate, fileSize, parentID || null, fileOwner, isFolder, uniqueName, entityLink ], (err, result) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      if(!isFolder){
        const sourceFile = path.join(__dirname, "..", "files", sourceFilename);
        const destFile = path.join(__dirname, "..", "files", uniqueName);
        fs.copyFile(sourceFile, destFile, (err)=>{
          if(err){
            throw err;
          }
          console.log(uniqueName);
        })
      }
      
      callback(null, result);
    }
  });
};

const getEntityParent = (userId, filename, callback) => {
  const query = `SELECT parent from filesystem_entity WHERE user_id = $1 AND file_name = $2`;
  db.query(query, [userId || null, filename], (err, result) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      console.log("File moved successfully");
      callback(null, result);
    }
  });
};

const getUserFolder = (userId, callback) => {
  const query = `SELECT file_id, file_name
                FROM filesystem_entity
                WHERE file_owner = $1 AND is_folder = TRUE`;
  db.query(query, [userId], (err, res) => {
    if (err) {
      console.error("Error: ", err);
    } else {
      callback(null, res.rows);
    }
  });
};

const getFolderName = (userId, folderId, callback) => {
  const query = `SELECT file_name 
  FROM filesystem_entity
  WHERE file_owner = $1 AND file_id = $2 and deleted_date IS NULL`;
  db.query(query, [userId, folderId], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, res);
    }
  });
};

const getEntityIdByName = (userId, entityName, callback) => {
  const query = `SELECT file_id
  FROM filesystem_entity
  WHERE file_owner = $1 AND file_name = $2 and deleted_date IS NULL`;
  db.query(query, [userId, entityName], (err, res) => {
    if (err) {
      console.error("Error: ", err);
    } else {
      callback(null, res.rows[0].file_id);
    }
  });
};

const getEntityDetailsByLink = (link, callback) => {
  const query = `SELECT *
  FROM filesystem_entity
  WHERE entity_link = $1`;
  db.query(query, [link], (err, res) => {
    if (err) {
      console.error("Error: ", err);
    } else {
      callback(null, res.rows);
    }
  });
};

const restoreFromBin = (fileName, ownerId, callback) => {
  const query = `UPDATE filesystem_entity
                  SET deleted_date = NULL
                  WHERE file_name = '${fileName}' AND file_owner = $1`;
  db.query(query, [ownerId], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      const message = ``;
      callback(null, message);
    }
  });
};

const renameEntity = (id, newName, callback) => {
  const query = `UPDATE filesystem_entity
                  SET file_name = $2
                  WHERE file_id = $1`;
  db.query(query, [id, newName], (err, res) => {
    if (err) {
      console.error(err);
      callback(err, null);
    } else {
      callback(null, res);
    }
  });
};

module.exports = {
  saveFileToDatabase,
  uploadFile,
  downloadFile,
  createFolder,
  getFilesInRoot,
  getFilesInFolder,
  getDeletedFiles,
  moveToBin,
  restoreFromBin,
  getFolderName,
  moveFile,
  getUserFolder,
  getEntityIdByName,
  renameEntity,
  getEntityDetailsByLink,
  copyFile,
};
