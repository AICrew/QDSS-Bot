const dotenv = require('dotenv');
dotenv.config({path: '../.env'});
//database
const fs = require('fs');
const dbFile = '../../database/sqlite.db';
const exists = fs.existsSync(dbFile);
const QDSS_DB = require('./dashboard-sqlite.js');
const sqlite3 = require('sqlite3').verbose();
const url = require("url");
const path = require("path");
const Discord = require("discord.js");
const http = require("http");

class QdssDashboard extends Discord.Client {
  constructor(options) {
    super(options);

    // Here we load the config.js file that contains our token and our prefix values.
    this.config = require("../config.js");
    // client.config.token contains the bot's token
    // client.config.prefix contains the message prefix
  }
}

const client = new QdssDashboard();

client.login(client.config.token);
client.on('ready', () => {console.log("dashboard ready")})

//create a server object:
const express = require('express');
const app = express();
const session = require('express-session');
const passwordProtected = require('express-password-protect');
const config = {
  username: "QDSS",
  password: "Siamolapiùbellacommunity!",
  maxAge: 86400000 // 1 day
};
app.use(passwordProtected(config));
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
var bodyParser = require("body-parser");
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', (req, res) => {
  res.render('homepage', {path: req.path});
});

app.post('/', (req, res) => {
  res.redirect('back')
});

app.get("/giocatori", (req, res) => {
  const db = QDSS_DB.Open();
  db.allAsync("SELECT * FROM Giochi G, Registrazioni R, Utenti U WHERE G.nome = R.game AND U.userId = R.userId").then( async (rows) => {
    if (rows !== undefined && rows.length > 0) {
      const gameName = rows[0].nomeCompleto;
      const color = rows[0].colore;
      const logo = rows[0].logo;

      var check = function check(user){
        return user.nomeCompleto === 'Apex Legends';
      }
      var filter = rows.filter(check);
      console.log('DB Apex Legends: '+ filter.length);
  
      const users = new Array();
  
      for (let i = 0; i < rows.length; i++){
        await client.fetchUser(rows[i].userId, true).then( (user) => {
          if (!user) return;
          // Si ottiene lo stato di presenza dell'utente e lo si inserisce nell'array corrispondente
          //const status = user.presence.status;
          function status(){
            if (user.presence.status == 'online') s = "1";
            else if (user.presence.status == 'idle') s = "2";
            else if (user.presence.status == 'dnd') s = "3";
            else if (user.presence.status == 'offline') s = "4";
          }

          function avatar(){
            if (user.avatarURL) a = user.avatarURL;
            else a = "http://aicrew.it/img/icon_discord.png";
          }

          status();
          var status = s;
          
          avatar();
          var avatar = a;

          users.push({tag: user.tag, nickname: rows[i].nickname, gioco: rows[i].nomeCompleto, avatar: avatar, status: status});
        }).catch( (err) => console.log("User " + rows[i].userId + " doesn't exist anymore, " + err));
      }
      var check = function check(user){
        return user.gioco === 'Apex Legends';
      }
      var filter = users.filter(check);
      console.log('Array Apex Legends: '+ filter.length);

      usersParsed = JSON.stringify(users);
      res.render('giocatori', {users: usersParsed, path: req.path});
    }
  })  
});

app.post('/giocatori', (req, res, next) => {
    res.redirect('/giocatori'); 

});

app.get("/classifica", (req, res) => {
  const db = QDSS_DB.Open();
  db.allAsync("SELECT *, SUM(deltaRep) FROM Esperienza E LEFT JOIN Reputazione R ON E.userId = R.userTo GROUP BY E.userId").then( async (rows) => {
    if (rows !== undefined && rows.length > 0) {
  
      const users = new Array();
  
      for (let i = 0; i < rows.length; i++){
        await client.fetchUser(rows[i].userId, true).then( (user) => {
          if (!user) return;
          // Si ottiene lo stato di presenza dell'utente e lo si inserisce nell'array corrispondente
          function avatar(){
            if (user.avatarURL) a = user.avatarURL;
            else a = "http://aicrew.it/img/icon_discord.png";
          }

          avatar();
          var avatar = a;

          users.push({tag: user.tag, avatar: avatar, level: rows[i].level, totalxp: rows[i].totalxp, levelxp: rows[i].levelxp, rep: rows[i]['SUM(deltaRep)']});
        }).catch( (err) => console.log("User " + rows[i].userId + " doesn't exist anymore, " + err));
      }
      usersParsed = JSON.stringify(users);
      res.render('classifica', {users: usersParsed, path: req.path});
    }
  })  
});

app.post('/classifica', (req, res) => {
  res.redirect('/classifica')
});


const port = 3000;
const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});