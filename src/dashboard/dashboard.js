const dotenv = require('dotenv');
dotenv.config({path: './../.env'});
const url = require("url");
const path = require("path");
const Discord = require("discord.js");
const http = require("http");

class QdssDashboard extends Discord.Client {
  constructor(options) {
    super(options);

    // Here we load the config.js file that contains our token and our prefix values.
    this.config = require("./../config");
    // client.config.token contains the bot's token
    // client.config.prefix contains the message prefix
  }
}

const client = new QdssDashboard();

client.login(client.config.token);
client.on('ready', () => {console.log("dashboard ready")})

// Create a server object:
const express = require('express');
const app = express();
const session = require('express-session');
const passwordProtected = require('express-password-protect');


app.use('/', express.static('public'));

var user = require('./routes/user');
app.use('/qdss', user);
app.use('/qdss', express.static('public'));


var admin = require('./routes/admin');
app.use('/admin', admin);
app.use('/admin', express.static('public'));


app.set('views', path.join(__dirname, 'views'));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
var bodyParser = require("body-parser");
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var os = require('os');
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