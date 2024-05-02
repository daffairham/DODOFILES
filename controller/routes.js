const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");

let currentDir = "filedir";

const readDirectory = (directory, callback) => {
  const directoryPath = path.join(__dirname, "..", directory);

  fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err, null);
    } else {
      const fileList = files.map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
      }));
      callback(null, fileList);
    }
  });
};

const saveFile = (file, directory, callback) => {
  const fileName = file.name;
  const filePath = path.join(__dirname, "..", directory, fileName);

  fs.writeFile(filePath, file.data, (err) => {
    if (err) {
      callback(err);
    } else {
      console.log("Uploaded into: " + filePath);
      callback(null);
    }
  });
};

router.get("/", (req, res) => {
  readDirectory('filedir', (err, fileList) => {
    if (err) {
      throw err;
    }
    res.render("index", { fileList, fileDir: currentDir });
  });
  currentDir = "filedir";
});

router.get("/recycle-bin", (req, res) => {
  readDirectory('recyclebin', (err, fileList) => {
    if (err) {
      throw err;
    }
    res.render("parts/recycleBin", { fileList, fileDir: currentDir });
  });
  currentDir = "filedir";
});

router.post("/upload", (req, res) => {
  const file = req.files.file;

  saveFile(file, currentDir, (err) => {
    if (err) {
      throw err;
    }
    readDirectory(currentDir, (err, fileList) => {
      if (err) {
        throw err;
      }
      res.render("parts/fileList", { fileList, fileDir: currentDir });
    });
  });
});

router.get("/download", (req, res) => {
  const fileName = req.query.filename;
  const filePath = path.join(__dirname, "..", currentDir, fileName);

  res.download(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
});

router.get("/folder", (req, res) => {
  currentDir += '\\' + req.query.foldername;
  readDirectory(currentDir, (err, fileList) => {
    if (err) {
      throw err;
    }
    res.render("parts/fileList", { fileList, fileDir: currentDir });
  });
});

router.get("/delete", (req, res) => {
  const fileName = req.query.filename;
  console.log("filename: " + fileName);
  const oldPath = path.join(__dirname, "..", "filedir", fileName);
  const newPath = path.join(__dirname, "..", "recyclebin", fileName);

  fs.rename(oldPath, newPath, (err)=>{
    if(err){
      throw err
    }
    else{
      res.send("Move Succesful")
    }
  })
});

router.get("/deleteFromSystem", (req, res) => {
  const fileName = req.query.filename;
  console.log("filename: " + fileName);
});

router.post("/rename", (req, res) => {
  const oldName = req.body.oldName;
  const newName = req.body.newName;
  const oldFilePath = path.join(__dirname, "..", currentDir, oldName);
  const newFilePath = path.join(__dirname, "..", currentDir, newName);

  fs.rename(oldFilePath, newFilePath, (err) => {
    if (err) {
      throw err;
    }
    console.log(`File ${oldFilePath} renamed to ${newName}`);
    readDirectory(currentDir, (err, fileList) => {
      if (err) {
        throw err;
      }
      res.render("parts/fileList", { fileList, fileDir: currentDir });
    });
  });
});

module.exports = router;
