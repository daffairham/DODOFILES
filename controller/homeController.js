const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");
const jwt = require("../config/jwt.js");

router.get("/home", jwt.authenticate, (req, res)=>{
  const userData = req.user;
  const userId = userData.user_id;
  console.log(userData);
  files.getFilesInRoot(userId, (err, fileList)=>{
    if(err){
      console.log(err);
    }
    else{
      res.render('index', {fileList, userData})
      console.log(fileList);
    }
  })
})

module.exports = router;
