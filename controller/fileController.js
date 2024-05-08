const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");
const jwt = require("../config/jwt.js");

router.post("/upload", jwt.authenticate, (req, res) => {
  const file = req.files.file;
  const userId = jwt.getIdFromToken(req.cookies.token);
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

router.get("/download", jwt.authenticate, (req, res) => {
  const fileName = req.query.filename;
  const filePath = path.join(__dirname, "..", "files", fileName);

  if (!req.cookies.token) {
    res.redirect("/");
  } else {
    res.download(filePath, (err) => {
      if (err) {
        throw err;
      }
    });
  }
});

router.post("/delete", jwt.authenticate, (req, res) => {
  const fileName = req.query.filename;
  const userId = jwt.getIdFromToken(req.cookies.token);
  files.moveToBin(fileName, userId, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500);
    } else {
      res.status(200).send();
    }
  });
});

router.post("/restore", jwt.authenticate, (req, res) => {
  const fileName = req.query.filename;
  const userId = jwt.getIdFromToken(req.cookies.token);
  files.restoreFromBin(fileName, userId, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500);
    } else {
      res.status(200).send();
    }
  });
});

router.get("/folder/:folderId", jwt.authenticate, (req, res) => {
  const folderId = req.params.folderId;
  const userData = req.user;
  const userId = req.user.user_id;
  let folderName = "";

  files.getFilesInFolder(userId, folderId, (err, fileList) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server Error");
    } else {
      files.getFolderName(userId, folderId, (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send("Server Error");
        } else {
          if (result && result.rows.length > 0) {
            folderName = result.rows[0].file_name;
            res.render("index", { fileList, userData, folderName });
            console.log(folderName);
          } else {
            res.status(403).send("You don't have permission to this folder.");
          }
        }
      });
    }
  });
});

router.get("/getFolderList", jwt.authenticate, (req, res)=>{
  const userId = req.user.user_id;
  files.getUserFolder(userId, (err, result)=>{
    if(err){
      throw err
    }
    console.log(result)
  })
})

router.get("/moveFile", jwt.authenticate, (req, res)=>{
  const userId = req.user.user_id;
  res.render("parts/moveFileModal");
})


module.exports = router;
