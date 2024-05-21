const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const sharing = require("../model/sharingModel.js");
const jwt = require("../config/jwt.js");

router.post("/share", jwt.authenticate, (req, res) => {
  let userId = "";
  const targetEmail = req.body.email;
  const entityId = req.body.entityid;
  let permission = req.body.permission;

  if (permission == 1) {
    permission = "r";
  } else {
    permission = "rw";
  }

  sharing.getUserIdToShare(targetEmail, (err, res) => {
    if (err) {
      throw err;
    }
    userId = res;
    sharing.checkPermissionExist(userId, entityId, (err, results) => {
      if (results.rows > 0) {
        res.send("User already has access to this file/folder");
        return
      } else {
        sharing.grantPermission(userId, entityId, permission, (err) => {
          if (err) {
            throw err;
          }
          console.log("File shared.");
        });
      }
    });
  });
  res.redirect(req.originalUrl);
});

router.get("/shared-files", jwt.authenticate, (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  sharing.getSharedFiles(userId, (err, fileList) => {
    if (err) {
      console.log(err);
    }
    res.render("sharedFiles", {
      fileList,
      userData,
      folderName: "",
      folderId: null,
    });
  });
});

module.exports = router;
