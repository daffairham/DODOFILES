const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");
const jwt = require("../config/jwt.js");
const bytes = require("bytes")
const { v4: uuidv4 } = require("uuid");

router.post("/upload", jwt.authenticate, (req, res) => {
  const file = req.files.file;
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const parent = req.body.folderId || null; 
  console.log("parent of uploaded file:", parent);
  files.uploadFile(file, parent, userId, (err, result) => {
    if (err) {
      throw err;
    } else {
      if(parent == null){
        files.getFilesInRoot(userId, (err, fileList) => {
          if (err) {
            throw err;
          } else {
            files.getUserFolder(userId, (err, folderList) => {
              if (err) {
                throw err;
              }
              res.render("parts/fileList", {
                fileList,
                userData,
                folderName: "",
                folderList,
              });
            });
          }
        });
      } else{
        files.getFilesInFolder(userId, parent, (err, fileList) => {
          if (err) {
            throw err;
          } else {
            files.getUserFolder(userId, (err, folderList) => {
              if (err) {
                throw err;
              }
              files.getFolderName(userId, parent, (err, folderName)=>{
                if(err){
                  throw err;
                }
                res.render("parts/fileList", {
                  fileList,
                  userData,
                  folderName: folderName.rows[0].file_name,
                  folderList,
                });
              })
            });
          }
        });
      }
      
    }
  });
});

router.get("/download", jwt.authenticate, (req, res) => {
  const fileName = req.query.filename;
  const userId = jwt.getIdFromToken(req.cookies.token);
  if (!req.cookies.token) {
    res.redirect("/");
  } else {
    console.log(fileName, userId);
    files.downloadFile(fileName, userId, res);
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
            files.getUserFolder(userId, (err, folderList) => {
              if (err) {
                throw err;
              }
              res.render("index", {
                fileList,
                userData,
                folderName: folderName,
                folderId: folderId,
                folderList,
              });
            });
          } else {
            res.status(403).send("You don't have permission to this folder.");
          }
        }
      });
    }
  });
});


router.get("/getFolderList", jwt.authenticate, (req, res) => {
  const userId = req.user.user_id;
  files.getUserFolder(userId, (err, result) => {
    if (err) {
      throw err;
    }
    console.log(result);
  });
});

router.post("/moveFile", jwt.authenticate, (req, res) => {
  const userId = req.user.user_id;
  const filename = req.body.filename;
  const parent = req.body.foldernames === "null" ? null : req.body.foldernames;

  files.moveFile(userId, filename, parent, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server Error");
    } else {
      files.getEntityIdByName(userId, filename, (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send("Server Error");
        } else {
          let parentDestination = result;

          if (Number(parent) === parentDestination) {
            return res.status(200).send();
          } else {
            console.log("File moved successfully.", parent, parentDestination);
            res.status(200).send();
          }
        }
      });
    }
  });
});

router.post("/copyFile", jwt.authenticate, (req, res) => {
  const userId = req.user.user_id;
  const filename = req.body.filename;
  const parent = req.body.foldernames === "null" ? null : req.body.foldernames;
  const uniqueName = uuidv4();
  const entityLink = uuidv4();
  const fileSize = req.body.fileSize;
  const isFolder = req.body.isFolder;
  const sourceFilename = req.body.sourceFilename;
  files.copyFile(filename, new Date(), fileSize, parent, userId, isFolder, uniqueName, entityLink, sourceFilename, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server Error");
    } else {
      files.getEntityIdByName(userId, filename, (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send("Server Error");
        } else {
          let parentDestination = result;

          if (Number(parent) === parentDestination) {
            return res.status(200).send();
          } else {
            console.log("File moved successfully.", parent, parentDestination);
            res.status(200).send();
          }
        }
      });
    }
  });
});

router.post("/createFolder", jwt.authenticate, (req, res) => {
  const userId = jwt.getIdFromToken(req.cookies.token);
  const fileName = req.body["folder-name"];
  const parent =
    req.body.folderparent === "null" ? null : req.body.folderparent;

  files.createFolder(fileName, new Date(), parent, userId, (err, result) => {
    if (err) {
      return res.status(500).send("Error creating folder.");
    }
    res.send();
  });
});

router.post("/rename", (req, res)=>{
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const file_id = req.body.fileid;
  const newEntityName = req.body.newName;
  files.renameEntity(file_id, newEntityName, (err)=>{
    if(err){
      console.error(err);
    }
    files.getFilesInRoot(userId, (err, fileList)=>{
      if(err){
        console.log(err);
      }
      else{
        files.getUserFolder(userId, (err, folderList)=>{
          if(err){
            throw err
          }
          res.render('parts/fileList', {fileList, userData, folderName: "", folderList});
        })
        
      }
    });
  })
});

router.get("/f/:link", (req, res)=>{
  const link = req.params.link;
  files.getEntityDetailsByLink(link, (err, results)=>{
    if(err){
      throw err
    }
    const size = bytes(results[0].size)
    res.render('fileDetails', {results, size})
  })
  
})


module.exports = router;
