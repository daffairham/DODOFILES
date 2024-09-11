const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const files = require("../model/files.js");
const sharing = require("../model/sharingModel.js");
const users = require("../model/users.js");
const jwt = require("../config/jwt.js");
const bytes = require("bytes");
const { format } = require('date-fns');
const { v4: uuidv4 } = require("uuid");

router.post("/upload", jwt.authenticate, async (req, res) => {
  const file = req.files.file;
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const parent = req.body.folderId || null; 
  try {
    await files.uploadFile(file, parent, userId);
    if (parent === null) {
      const fileList = await files.getFilesInRoot(userId);
      const folderList = await files.getUserFolder(userId);
      let entityAmt = fileList.length + folderList.length;
      res.render("parts/fileList", {
        fileList,
        userData,
        folderName: "",
        folderList,
        entityAmt
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

router.post("/delete", jwt.authenticate, async (req, res) => {
  const fileName = req.query.filename;
  const userId = jwt.getIdFromToken(req.cookies.token);
  try {
    await files.moveToBin(fileName, userId);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/restore", jwt.authenticate, async (req, res) => {
  const fileName = req.query.filename;
  const userId = jwt.getIdFromToken(req.cookies.token);
  try {
    await files.restoreFromBin(fileName, userId);
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
    if (folderName.rows.length === 0) {
      res.status(403).send("You don't have permission to this folder.");
      return;
    }
    const folderList = await files.getUserFolder(userId);
    res.render("index", {
      fileList,
      userData,
      folderName: folderName.rows[0].file_name,
      folderId,
      folderList,
      entityAmt: fileList.length
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
    console.log(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/moveFile", jwt.authenticate, async (req, res) => {
  const userId = req.user.user_id;
  const filename = req.body.filename;
  const parent = req.body.foldernames === "null" ? null : req.body.foldernames;

  try {
    await files.moveFile(userId, filename, parent);
    const result = await files.getEntityIdByName(userId, filename);
    const parentDestination = result.file_id;

    if (Number(parent) === parentDestination) {
      res.status(200).send();
    } else {
      console.log("File moved successfully.", parent, parentDestination);
      res.status(200).send();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/copyFile", jwt.authenticate, async (req, res) => {
  const userId = req.user.user_id;
  const filename = req.body.filename;
  const parent = req.body.foldernames === "null" ? null : req.body.foldernames;
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
      entityLink
    );
    
    const result = await files.getEntityIdByName(userId, filename);
    const parentDestination = result.file_id;

    if (Number(parent) === parentDestination) {
      res.status(200).send("File copied successfully.");
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
  const parent = req.body.folderparent === "null" ? null : req.body.folderparent;

  try {
    await files.createFolder(fileName, new Date(), parent, userId);
    if (parent !== null) {
      res.redirect(`/folder/${parent}`);
    } else {
      res.redirect(`/`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating folder.");
  }
});

router.post("/rename", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);
  const file_id = req.body.fileid;
  const newEntityName = req.body.newName;
  const parent = req.body.currentFolder || null; 

  try {
    await files.renameEntity(file_id, newEntityName);
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
        entityAmt
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
        entityAmt
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
    const results = await files.getEntityDetailsByLink(link);
    const size = bytes(results[0].size);
    res.render('fileDetails', { results, size });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/sharedUsers", jwt.authenticate, async (req, res) => {
  const entityId = req.query.fileid;
  try {
    const sharedUserLists = await sharing.getSharedUsers(entityId);
    res.render('parts/sharedUsers', { sharedUserLists });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/properties", jwt.authenticate, async (req, res) => {
  const entityId = req.query.fileid;
  try {
    const fileDetails = await files.getEntityDetailsById(entityId);
    const size = bytes(fileDetails[0].size);
    const owner = await users.getUsernameById(fileDetails[0].file_owner)
    const date = format(new Date(fileDetails[0].upload_date), 'dd MMMM yyyy');
    console.log(owner);
    res.render('parts/propertiesDetails', { fileDetails, size, date, owner: owner.username });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
