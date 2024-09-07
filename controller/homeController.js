const express = require("express");
const router = express.Router();
const files = require("../model/files.js");
const jwt = require("../config/jwt.js");

router.get("/home", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = jwt.getIdFromToken(req.cookies.token);

  try {
    const fileList = await files.getFilesInRoot(userId);
    const folderList = await files.getUserFolder(userId);
    let entityAmt = fileList.length + folderList.length; //Jumlah entity
    res.render('index', { fileList, userData, folderName: "", folderList, folderId: null, entityAmt });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/recycle-bin", jwt.authenticate, async (req, res) => {
  const userData = req.user;
  const userId = userData.user_id;
  try {
    const fileList = await files.getDeletedFiles(userId);
    res.render('bin', { fileList, userData, folderId: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/folderTab", jwt.authenticate, async (req, res) => {
  const userId = jwt.getIdFromToken(req.cookies.token);

  try {
    const folderList = await files.getUserFolder(userId);
    res.render("parts/folderModalContent", { folderList });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/fileTab", jwt.authenticate, async (req, res) => {
  const userId = jwt.getIdFromToken(req.cookies.token);

  try {
    const folderList = await files.getUserFolder(userId);
    res.render("parts/uploadModal", { folderList });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
