var express = require('express');
var admin = express.Router();
const passwordProtected = require('express-password-protect');
const fs = require('fs');
const dbFile = '../../../database/sqlite.db';
const exists = fs.existsSync(dbFile);
const QDSS_DB = require('../dashboard-sqlite.js');
const sqlite3 = require('sqlite3').verbose();
const Discord = require("discord.js");

class QdssDashboard extends Discord.Client {
  constructor(options) {
    super(options);

    // Here we load the config.js file that contains our token and our prefix values.
    this.config = require("../../config.js");
    // client.config.token contains the bot's token
    // client.config.prefix contains the message prefix
  }
}
const client = new QdssDashboard();
client.login(client.config.token);

//Admin
const Admin = {
    username: process.env.ADMIN,
    password: process.env.AdminPassword,
    maxAge: 86400000 //1 day
  }
admin.use(passwordProtected(Admin))

admin.get('/richieste', (req, res) => {
  const db = QDSS_DB.Open();
  db.allAsync("SELECT * FROM Richieste").then( async (rows) => {
    if (rows !== undefined && rows.length > 0) {
      const request = new Array();
  
      for (let i = 0; i < rows.length; i++){
          request.push({requestId: rows[i].RequestID, user: rows[i].User, messaggio: rows[i].Messaggio, status: rows[i].Status});
      }
      requestParsed = JSON.stringify(request);
      res.render('richieste', {richieste: requestParsed, path: req.path});
    }
  }).catch( (err) => console.log(err));

})

admin.post('/richieste', (req, res) => {
  const db = QDSS_DB.Open();
  var RequestID = req.body.RequestID;
  var Status = req.body.Status;
  if (Status && RequestID){
    let data = [Status, RequestID];
    db.run('UPDATE Richieste SET Status = ? WHERE RequestID = ?', data, (err, rows) => {
      if (err) throw err;
    })
  }
  res.redirect('/admin/richieste');
});

module.exports = admin;