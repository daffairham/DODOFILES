const express = require("express");
const controller = require("./controller/routes")
const bodyParser = require('body-parser');
const upload = require("express-fileupload")
const cookieParser = require("cookie-parser");

const loginController = require("./controller/loginController")
const registerController = require("./controller/registerController")
const homeController = require("./controller/homeController")
const fileController = require("./controller/fileController")

const app = express();
const PORT = 8000;


app.use(cookieParser())
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload())

app.use('/', loginController);
app.use('/', registerController);
app.use('/', homeController);
app.use('/', fileController);


app.set('view engine', 'ejs');

app.listen(PORT, ()=>{
  console.log(`Listening on PORT ${PORT}`);
})

