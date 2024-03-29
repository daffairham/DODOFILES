const express = require("express");
const controller = require("./controller/routes")
const bodyParser = require('body-parser');
const upload = require("express-fileupload")

const app = express();
const PORT = 8000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload())

app.use('/', controller);

app.set('view engine', 'ejs');

app.listen(PORT, ()=>{
  console.log(`Listening on PORT ${PORT}`);
})

