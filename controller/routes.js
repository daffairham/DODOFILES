const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");

let currentDir = "filedir"; //untuk nyimpan folder apa yang lagi dibuka

router.get("/", (req, res) => {
  const fileDir = path.join(__dirname, "..", "filedir") || "";
  fs.readdir(fileDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      throw err;
    }
    const fileList = files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
    }));

    res.render("index", { fileList, fileDir });
  });
});

router.post("/upload", (req, res) => {
  const file = req.files;
  const fileName = file.file.name;
  let uploads = "";
  let dir = "";
  if (currentDir === "") {
    uploads = path.join(__dirname, "..", "filedir", fileName);
    dir = path.join(__dirname, "..", "filedir");
  } else {
    uploads = path.join('filedir', currentDir, fileName);
    dir = path.join(__dirname, "..", "filedir");
  }

  fs.writeFile(uploads, file.file.data, (err, data) => {
    if (err) {
      throw err;
    } else {
      fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) {
          throw err;
        }
        const fileList = files.map((file) => ({
          name: file.name,
          isDirectory: file.isDirectory(),
        }));
        if (currentDir === "") {
          res.render("index", { fileList });
        } else {
          res.render("parts/inside-folder", {
            fileList,
            folderName: currentDir,
            fileName: file.name
          });
        }
      });
    }
    console.log("Uploaded into: " + uploads);
  });
});

router.get("/download", (req, res) => {
  console.log(currentDir);
  const fileName = req.query.filename;
  let filePath = "";
  if(currentDir !== "filedir"){
    filePath = path.join(__dirname, "..", "filedir", fileName);
    console.log(filePath);
  } else{
    filePath = path.join(__dirname, "..", "filedir", fileName);
  }

  res.download(filePath, (err, res) => {
    if (err) {
      throw err;
    }
  });
});

router.get("/folder", (req, res) => {
  const folderName = req.query.foldername;
  const fileDir = path.join(__dirname, "..", "filedir", folderName);
  console.log("current directory: " + currentDir);
  fs.readdir(fileDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      throw err;
    }
    const fileList = files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
    }));

    res.render("parts/inside-folder", { fileList, folderName, fileDir });
  });
  currentDir = folderName;
  
});

router.get("/delete", (req, res) => {
  const fileName = req.query.filename;
  const filePath = path.join(currentDir, fileName);

  console.log("filePath: " + filePath);

  // fs.unlink(filePath, (err) => {
  //   if (err) {
  //     throw err;
  //   }
  //   console.log(`File ${fileName} deleted`);
  //   res.redirect("/");
  // });
});

router.post("/rename", (req, res) => {
  const oldName = req.body.oldName;
  const newName = req.body.newName;
  const oldFilePath = path.join(currentDir, oldName);
  const newFilePath = path.join(currentDir, newName);

  fs.rename(oldFilePath, newFilePath, (err) => {
    if (err) {
      throw err;
    }
    console.log(`File ${oldFilePath} renamed to ${newName}`);
    fs.readdir(currentDir, { withFileTypes: true }, (err, files) => {
      if (err) {
        throw err;
      }
      const fileList = files.map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
      }));
      if (currentDir === "") {
        res.render("parts/fileList", { fileList });
      } else {
        res.render("parts/inside-folder", { fileList, folderName: currentDir });
      }
    });
  });
});

module.exports = router;
