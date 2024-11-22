const express = require("express");
const fs = require("fs");
const archiver = require("archiver");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");
const sharing = require("../model/sharingModel.js");
const users = require("../model/users.js");
const jwt = require("../config/jwt.js");
const bytes = require("bytes");
const { format } = require("date-fns");
const { v4: uuidv4 } = require("uuid");

router.post("/upload", jwt.authenticate, async (req, res) => {
  const file = req.files.file;
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const parent = req.body.folderId || null;
  try {
    const uploadedFile = await files.uploadFile(file, parent, userId);

    if (parent !== null) {
      await sharing.handleNewUpload(uploadedFile.file_id, parent, userId);
    }

    if (parent === null) {
      const fileList = await files.getFilesInRoot(userId);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: "",
        folderList,
        entityAmt,
      });
    } else {
      const fileList = await files.getFilesInFolder(userId, parent);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      const folderName = await files.getFolderName(userId, parent);
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: folderName.rows[0].file_name,
        folderList,
        entityAmt,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/uploadMultiple", jwt.authenticate, async (req, res) => {
  const filesUploaded = req.files.file;
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const parent = req.body.folderId || null;
  try {
    for (const file of filesUploaded) {
      await files.uploadFile(file, parent, userId);
    }
    if (parent === null) {
      const fileList = await files.getFilesInRoot(userId);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: "",
        folderList,
        entityAmt,
      });
    } else {
      const fileList = await files.getFilesInFolder(userId, parent);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      const folderName = await files.getFolderName(userId, parent);
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: folderName.rows[0].file_name,
        folderList,
        entityAmt,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/uploadFolder", jwt.authenticate, async (req, res) => {
  const filesUploaded = req.files.file;
  const folderName = req.body.folderName;
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const parent = req.body.folderId || null;
  try {
    for (const file of filesUploaded) {
      await files.uploadFile(file, parent, userId);
    }
    if (parent === null) {
      const fileList = await files.getFilesInRoot(userId);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: "",
        folderList,
        entityAmt,
      });
    } else {
      const fileList = await files.getFilesInFolder(userId, parent);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      const folderName = await files.getFolderName(userId, parent);
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: folderName.rows[0].file_name,
        folderList,
        entityAmt,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/download", jwt.authenticate, async (req, res) => {
  const fileName = req.query.filename;
  const userId = jwt.getIdFromToken(req.cookies.token);
  if (!req.cookies.token) {
    res.redirect("/");
    return;
  }
  try {
    await files.downloadFile(fileName, userId, res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/downloadFolder/:folderId", jwt.authenticate, async (req, res) => {
  try {
  } catch (err) {}
});

router.post("/delete", jwt.authenticate, async (req, res) => {
  const fileName = req.query.filename;
  const fileIdFromDB = await files.getEntityIdByName(fileName);
  const fileId = await fileIdFromDB.file_id;
  const userId = jwt.getIdFromToken(req.cookies.token);
  try {
    await files.moveToBin(fileId, userId);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/restore", jwt.authenticate, async (req, res) => {
  const fileId = req.query.fileid;
  const userId = jwt.getIdFromToken(req.cookies.token);
  try {
    await files.restoreFromBin(fileId, userId);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/folder/:folderId", jwt.authenticate, async (req, res) => {
  const folderId = req.params.folderId;
  const userData = req.user;
  const userId = req.user.user_id;
  try {
    const fileList = await files.getFilesInFolder(userId, folderId);
    const folderName = await files.getFolderName(userId, folderId);
    const folderList = await files.getUserFolder(userId);
    res.render("index", {
      fileList,
      userData,
      folderName: folderName.rows[0].file_name,
      folderId,
      folderList,
      entityAmt: fileList.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/getFolderList", jwt.authenticate, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const result = await files.getUserFolder(userId);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/moveFile", jwt.authenticate, async (req, res) => {
  const userId = req.user.user_id;
  const fileid = req.body.fileid;
  let parent;
  if (req.body.foldernames === "null") {
    parent = null;
  } else {
    parent = req.body.foldernames;
  }

  try {
    await files.moveFile(userId, fileid, parent);
    const result = files.getEntityIdByName(filename);
    const parentDestination = result.file_id;

    if (Number(parent) === parentDestination) {
      res.status(200).send();
    } else {
      res.status(200).send();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/copyFile", jwt.authenticate, async (req, res) => {
  const userId = req.user.user_id;
  const fileId = req.body.fileid;
  const filename = await files.getEntityNameById(fileId);

  let parent;
  if (req.body.foldernames === "null") {
    parent = null;
  } else {
    parent = req.body.foldernames;
  }

  const entityLink = uuidv4();
  const fileSize = req.body.fileSize;
  const isFolder = req.body.isFolder;
  const sourceFilename = req.body.sourceFilename;

  try {
    await files.copyFile(
      filename,
      new Date(),
      fileSize,
      parent,
      userId,
      isFolder,
      sourceFilename,
      entityLink,
      new Date()
    );

    console.log(filename);
    const result = await files.getEntityIdByName(filename);
    console.log(result);
    const parentDestination = result.file_id;

    if (Number(parent) === parentDestination) {
      res.status(200).send();
    } else {
      res.status(200).send();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/createFolder", jwt.authenticate, async (req, res) => {
  const userId = jwt.getIdFromToken(req.cookies.token);
  const fileName = req.body["folder-name"];
  const parent =
    req.body.folderparent === "null" ? null : req.body.folderparent;

  try {
    const newFolder = await files.createFolder(
      fileName,
      new Date(),
      parent,
      userId,
      new Date()
    );

    if (parent !== null) {
      await sharing.handleNewUpload(newFolder.file_id, parent, userId);
    }
    if (parent !== null) {
      res.redirect(`/folder/${parent}`);
    } else {
      res.redirect(`/`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/rename", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const file_id = req.body.fileid;
  const newEntityName = req.body.newName;
  try {
    const rename = await files.renameEntity(file_id, newEntityName);
    const parent = rename.parent;
    if (parent === null) {
      const fileList = await files.getFilesInRoot(userId);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: "",
        folderList,
        folderId: parent || null,
        entityAmt,
      });
    } else {
      const fileList = await files.getFilesInFolder(userId, parent);
      const folderList = await files.getUserFolder(userId);
      const folderName = await files.getFolderName(userId, parent);
      let entityAmt = fileList.length + folderList.length;
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: folderName.rows[0].file_name,
        folderList,
        entityAmt,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/f/:link", jwt.authenticate, async (req, res) => {
  const link = req.params.link;
  try {
    const fileDetails = await files.getEntityDetailsByLink(link);
    const size = bytes(fileDetails[0].size);
    const uploadDate = format(
      new Date(fileDetails[0].upload_date),
      "dd MMMM yyyy"
    );
    const modifiedDate = format(
      new Date(fileDetails[0].modified_date),
      "dd MMMM yyyy"
    );
    res.render("fileDetails", { fileDetails, size, uploadDate, modifiedDate });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/sharedUsers", jwt.authenticate, async (req, res) => {
  const entityId = req.query.fileid;
  try {
    const sharedUserLists = await sharing.getSharedUsers(entityId);
    res.render("parts/sharedUsers", { sharedUserLists });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/properties", jwt.authenticate, async (req, res) => {
  const entityId = req.query.fileid;
  console.log(entityId);
  try {
    const fileDetails = await files.getEntityDetailsById(entityId);
    const size = bytes(fileDetails[0].size);
    const owner = await users.getUserDetailsById(fileDetails[0].file_owner);
    const uploadDate = format(
      new Date(fileDetails[0].upload_date),
      "dd MMMM yyyy"
    );
    const modifiedDate = format(
      new Date(fileDetails[0].modified_date),
      "dd MMMM yyyy"
    );
    res.render("parts/propertiesDetails", {
      fileDetails,
      size,
      uploadDate,
      modifiedDate,
      owner: owner.username,
      ownerEmail: owner.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/editPButton", jwt.authenticate, async (req, res) => {
  const userId = req.body.userId;
  const entityId = req.body.entityid;
  const permissionData = await users.getUserPermission(userId, entityId);

  try {
    res.render("parts/editPermission", { user: permissionData });
  } catch (error) {
    throw error;
  }
});

router.post("/deleteFromSystem", jwt.authenticate, async (req, res) => {
  const owner = jwt.getIdFromToken(req.cookies.token);
  const fileId = req.query.fileid;
  const isFolder = await files.checkEntityType(fileId);
  try {
    await files.deleteEntity(isFolder, fileId, owner);
    res.status(200).send();
  } catch (error) {
    throw error;
  }
});

module.exports = router;
