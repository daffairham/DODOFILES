const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");
const jwt = require("../config/jwt.js");

router.get("/home", jwt.authenticate, (req, res)=>{
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  files.getFilesInRoot(userId, (err, fileList)=>{
    if(err){
      console.log(err);
    }
    else{
      files.getUserFolder(userId, (err, folderList)=>{
        if(err){
          throw err
        }
        console.log("params:", req.params);
        res.render('index', {fileList, userData, folderName: "", folderList, folderId: null});
      })
      
    }
  });
});



router.get("/bin", jwt.authenticate, (req, res)=>{
  const userData = req.user;
  const userId = userData.user_id;
  files.getDeletedFiles(userId, (err, fileList)=>{
    if(err){
      console.log(err);
    }
    else{
      res.render('bin', {fileList, userData, folderId: null});
    }
  });
});

router.get("/folderTab", jwt.authenticate, (req, res)=>{
  const userId = jwt.getIdFromToken(req.cookies.token);
  files.getUserFolder(userId, (err, folderList)=>{
    if(err){
      throw err
    }
    res.render("parts/folderModalContent", {folderList});
  })
});

router.get("/fileTab", jwt.authenticate, (req, res)=>{
  const userId = jwt.getIdFromToken(req.cookies.token);
  files.getUserFolder(userId, (err, folderList)=>{
    if(err){
      throw err
    }
    res.render("parts/uploadModal", {folderList});
  })
});

module.exports = router;
