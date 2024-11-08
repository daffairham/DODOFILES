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
  let permission = "r";

  try {
    const entityTipe = await files.checkEntityType(entityId);
    const isFolder = entityTipe.is_folder;
    const userId = await sharing.getUserIdToShare(targetEmail);
    const permissionExist = await sharing.checkPermissionExist(
      userId,
      entityId
    );
    if (permissionExist.rows > 0) {
      res.send("User already has access to this file/folder");
      return;
    }

    if (isFolder) {
      await sharing.grantPermission(userId, entityId, permission); //kasih akses untuk folder
      const childrenEntity = await files.getChildFromParent(entityId);
      for (const file_id of childrenEntity) {
        await sharing.grantPermission(userId, file_id.file_id, permission); //kasih akses untuk entity dlm folder
      }
    } else {
      await sharing.grantPermission(userId, entityId, permission);
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
    const entityTipe = await files.checkEntityType(entityId);
    const isFolder = entityTipe.is_folder;
    console.log(isFolder);
    if (isFolder) {
      await sharing.removeSharedAccess(userId, entityName);
      const childrenEntity = await files.getChildFromParent(entityId);
      for (const file_id of childrenEntity) {
        const id = await files.getEntityNameById(file_id.file_id);
        const childrenName = id.file_name;
        await sharing.removeSharedAccess(userId, childrenName); //kasih akses untuk entity dlm folder
      }
    } else {
      const id = await files.getEntityIdByName(entityName);
      await sharing.removeSharedAccess(userId, id.file_id);
    }
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
      entityAmt: fileList.length,
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
  const getId = await files.getEntityIdByName(entityName);
  const entityId = getId.file_id;
  try {
    const entityTipe = await files.checkEntityType(entityId);
    const isFolder = entityTipe.is_folder;
    console.log(isFolder);
    if (isFolder) {
      await sharing.removeSharedAccess(userId, entityName);
      const childrenEntity = await files.getChildFromParent(entityId);
      for (const file_id of childrenEntity) {
        const id = await files.getEntityNameById(file_id.file_id);
        const childrenName = id.file_name;
        await sharing.removeSharedAccess(userId, childrenName); //kasih akses untuk entity dlm folder
      }
    } else {
      const id = await files.getEntityIdByName(entityName);
      await sharing.removeSharedAccess(userId, id.file_id);
    }
    sharing.removeSharedAccess(userId, entityName);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

router.post("/renameSharedFile", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const file_id = req.body.fileid;
  const newEntityName = req.body.newName;
  const parent = req.body.currentFolder || null;
  try {
    await files.renameEntity(file_id, newEntityName);
    const fileList = await sharing.getSharedFiles(userId);
    res.render("parts/sharedFileList", {
      fileList,
      userData,
      folderName: "",
      folderId: null,
      entityAmt: fileList.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/sharedFolder/:folderId", jwt.authenticate, async (req, res) => {
  const folderId = req.params.folderId;
  const userData = req.user;
  const userId = req.user.user_id;
  try {
    const fileList = await sharing.getSharedFolderFiles(userId, folderId);
    const folderName = await files.getFolderName(userId, folderId);
    const folderList = await files.getUserFolder(userId);

    res.render("sharedFiles", {
      fileList,
      userData,
      folderId,
      folderList,
      entityAmt: fileList.length,
      folderName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/changePermission", jwt.authenticate, async (req, res) => {
  const userId = req.body.userId;
  const entityId = req.body.entityid;
  const changedPermission = req.body.userpermission;
  try {
    let permissionType = "";
    if (changedPermission === "view") {
      permissionType = "r";
    } else if (changedPermission === "edit") {
      permissionType = "rw";
    } else {
      res.status(500).send("error");
    }
    const result = await sharing.changePermission(
      permissionType,
      userId,
      entityId
    );
    const childEntities = await files.getChildFromParent(result.file_id);
    if (childEntities.length > 0) {
      for (let i = 0; i < childEntities.length; i++) {
        const childEntity = parent[i].file_id;
        await sharing.changePermission(permissionType, userId, childEntity);
      }
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
