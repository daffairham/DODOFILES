const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");
const jwt = require("../config/jwt.js");

router.get("/home", jwt.authenticate, (req, res)=>{
  const userData = req.user;
  const userId = userData.user_id;
  files.getFilesInRoot(userId, (err, fileList)=>{
    if(err){
      console.log(err);
    }
    else{
      res.cookie("userId", userId); 
      res.render('index', {fileList, userData});
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
      res.render('parts/recycleBin', {fileList, userData});
    }
  });
});
module.exports = router;
