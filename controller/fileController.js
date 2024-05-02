const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");

router.post("/upload", (req, res) => {
  const file = req.files.file;
  const userId = req.body.userid;
  files.uploadFile(file, null, userId, (err, result) => {
    if (err) {
      throw err;
    } else {
      files.getFilesInRoot(userId, (err, fileList) => {
        if (err) {
          throw err;
        } else {
          res.render("parts/fileList", { fileList });
        }
      });
    }
  });
});

router.get("/download", (req, res) => {
  const fileName = req.query.filename;
  const filePath = path.join(__dirname, "..", "files", fileName);

  res.download(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
});

module.exports = router;
