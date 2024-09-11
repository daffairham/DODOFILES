const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const sharing = require("../model/sharingModel.js");
const jwt = require("../config/jwt.js");
const files = require("../model/files.js");

router.post("/share", jwt.authenticate, async (req, res) => {
  const targetEmail = req.body.email;
  const entityId = req.body.entityid;
  let permission = req.body.permission === "1" ? "r" : "rw";

  try {
    const userId = await sharing.getUserIdToShare(targetEmail);
    
    const permissionExist = await sharing.checkPermissionExist(userId, entityId);
    
    if (permissionExist.rows > 0) {
      res.send("User already has access to this file/folder");
      return;
    }

    await sharing.grantPermission(userId, entityId, permission);
    console.log("File shared.");
    
    res.redirect(req.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while sharing the file/folder.");
  }
});

router.post("/removeAccess", jwt.authenticate, async (req, res) => {
  const userId = req.body.userId;
  const entityId = req.body.entityid;
  const result = await files.getEntityNameById(entityId);
  const entityName = result.file_name;
  try {
    sharing.removeSharedAccess(userId, entityName);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

router.get("/shared-files", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);

  try {
    const fileList = await sharing.getSharedFiles(userId);
    res.render("sharedFiles", {
      fileList,
      userData,
      folderName: "",
      folderId: null,
      entityAmt: fileList.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

router.post("/removeSharedFile", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const entityName = req.query.filename;
  try {
    sharing.removeSharedAccess(userId, entityName);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

module.exports = router;
