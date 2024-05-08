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
        if(err);
        console.error(err);
      })
      res.render('index', {fileList, userData, folderName: ""});
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
      res.render('bin', {fileList, userData});
    }
  });
});
module.exports = router;
