const dotenv = require('dotenv');
dotenv.config({path: './../.env'});
const url = require("url");
const path = require("path");
const http = require("http");


// Create a server object:
const express = require('express');
const app = express();
const session = require('express-session');
const passwordProtected = require('express-password-protect');


app.use('/', express.static('public'));

const user = require('./routes/user');
app.use('/qdss', user);
app.use('/qdss', express.static('public'));


const admin = require('./routes/admin');
app.use('/admin', admin);
app.use('/admin', express.static('public'));


app.set('views', path.join(__dirname, 'views'));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

const os = require('os');
console.log(os.cpus());

// Homepage
app.get('/', (req, res) => {
  res.render('homepage', {path: req.path});
});

app.post('/', (req, res) => {
  res.redirect('back');
});

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
