const db = require("../config/db.js");
const fs = require("fs");
const path = require("path");

const saveFileToDatabase = (
  filename,
  uploadDate,
  size,
  parent,
  fileOwner,
  callback
) => {
  const query = `INSERT INTO files(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder)
                    VALUES ($1, $2, $3, $4, NULL, $5, FALSE)`;

  db.query(
    query,
    [filename, uploadDate, size, parent, fileOwner],
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

const uploadFile = (file, parent, fileOwner, callback) => {
  const fileName = file.name;
  const filePath = path.join(__dirname, "..", "files", fileName);

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
        callback
      );
    }
  });
};

const createFolder = (filename, uploadDate, parent, fileOwner, callback) => {
  const query = `INSERT INTO files(file_name, upload_date, size, parent, deleted_date, file_owner, is_folder)
                    VALUES ($1, $2, 0, $3, NULL, $4, TRUE)`;

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
                FROM files
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
                FROM files
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
                FROM files
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
  const query = `UPDATE files
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

const moveFile = (fileName, folderDestination, callback) => {
  const query = `UPDATE files
                  SET parent = $1
                  WHERE file_name = '${fileName}'`;
  db.query(query, [folderDestination], (err, res) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      const message = ``;
      callback(null, message);
    }
  });
};

const getUserFolder = (userId, callback)=>{
  const query = `SELECT file_name
                FROM files
                WHERE file_owner = $1 AND is_folder = TRUE`
  db.query(query, [userId], (err, res)=>{
    if(err){
      console.error("Error: ", err);
    }
    else{
      callback(null, res.rows);
    }
  })
}

const getFolderName = (userId, folderId, callback) => {
  const query = `SELECT file_name 
  FROM files
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

const restoreFromBin = (fileName, ownerId, callback) => {
  const query = `UPDATE files
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

module.exports = {
  saveFileToDatabase,
  uploadFile,
  createFolder,
  getFilesInRoot,
  getFilesInFolder,
  getDeletedFiles,
  moveToBin,
  restoreFromBin,
  getFolderName,
  moveFile,
  getUserFolder,
};
