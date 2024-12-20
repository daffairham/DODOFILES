const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const sharing = require("../model/sharingModel.js");
const jwt = require("../config/jwt.js");
const files = require("../model/files.js");

router.post("/share", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const targetEmail = req.body.email;
  const entityId = req.body.entityid;
  const permission = "r";
  const currentUserEmail = userData.email;
  try {
    // const isFolder = entityTipe.is_folder;
    const userId = await sharing.getUserIdToShare(targetEmail);
    const permissionExist = await sharing.checkPermissionExist(
      userId,
      entityId
    ); // untuk meriksa apakah user target sudah memiliki akses terhadap file yg ingin dibagikan

    /* periksa apakah email yang dimasukkan sama dengan email login dari pengguna.
    kondisi dibuat untuk mencegah pengguna membagikan sebuah file ke dirinya sendiri. */
    if (currentUserEmail === targetEmail) {
      return res.status(409).json({ message: "1" });
    }
    /* periksa apakah user tujuan terdaftar dalam database. */
    if (!userId) {
      return res.status(404).send("User not registered");
    }
    /* periksa apakah user sudah memiliki akses terhadap file yang ingin dibagikan */
    if (permissionExist.length > 0) {
      return res.status(409).json({ message: "2" });
    }

    const index = req.body.index;
    await sharing.grantPermission(userId, entityId, permission);
    const sharedUserLists = await sharing.getSharedUsers(entityId);
    const fileDetails = await files.getEntityDetailsById(entityId);
    res.render("parts/sharedUsers", {
      sharedUserLists,
      index,
      file: fileDetails[0],
    });
  } catch (err) {
    console.error(err);
  }
});

router.post("/removeAccess", jwt.authenticate, async (req, res) => {
  const userId = req.body.userId;
  const entityId = req.body.entityid;
  const result = await files.getEntityNameById(entityId);
  const entityName = result.file_name;
  try {
    const isFolder = await files.checkEntityType(entityId);
    if (isFolder) {
      await sharing.removeSharedAccess(userId, entityName);
      const childrenEntity = await files.getChildFromParent(entityId);
      for (const file_id of childrenEntity) {
        const id = await files.getEntityNameById(file_id.file_id);
        await sharing.removeSharedAccess(userId, file_id.file_id);
      }
    } else {
      await sharing.removeSharedAccess(userId, entityId);
    }
    sharing.removeSharedAccess(userId, entityId);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
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
    res.status(500).send();
  }
});

router.post("/removeSharedFile", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const entityName = req.query.filename;
  const getId = await files.getEntityIdByName(entityName);
  const entityId = getId.file_id;
  try {
    const isFolder = await files.checkEntityType(entityId);
    if (isFolder) {
      await sharing.removeSharedAccess(userId, entityId);
      const childrenEntity = await files.getChildFromParent(entityId);
      for (const file_id of childrenEntity) {
        const id = await files.getEntityNameById(file_id.file_id);
        const childrenId = id.file_id;
        await sharing.removeSharedAccess(userId, childrenId);
      }
    } else {
      const id = await files.getEntityIdByName(entityName);
      await sharing.removeSharedAccess(userId, id.file_id);
    }
    sharing.removeSharedAccess(userId, entityId);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
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
    res.status(500).send();
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
    res.status(500).send();
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
      res.status(500).send();
    }
    const result = await sharing.changePermission(
      permissionType,
      userId,
      entityId
    );
    const childEntities = await files.getChildFromParent(result.file_id);
    if (childEntities.length > 0) {
      for (let i = 0; i < childEntities.length; i++) {
        const childEntity = childEntities[i].file_id;
        await sharing.changePermission(permissionType, userId, childEntity);
      }
    }
    const sharedUserLists = await sharing.getSharedUsers(entityId);
    res.render("parts/sharedUsers", { sharedUserLists });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
