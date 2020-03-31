const dotenv = require('dotenv');
dotenv.config({path: '../../.env'});
var express = require('express');
var user = express.Router();
const passwordProtected = require('express-password-protect');
const QDSS_DB = require('../dashboard-sqlite.js');
const Discord = require("discord.js");


class QdssDashboard extends Discord.Client {
    constructor(options) {
      super(options);
  
      // Here we load the config.js file that contains our token and our prefix values.
      this.config = require("../../config");
      // client.config.token contains the bot's token
      // client.config.prefix contains the message prefix
    }
}

const client = new QdssDashboard();
client.login(client.config.token);

// User
/*const User = {
  username: process.env.USER,
  password: process.env.UserPassword,
  maxAge: 86400000 // 1 day
};
user.use(passwordProtected(User))*/

user.get("/giocatori", (req, res) => {
  const db = QDSS_DB.Open();

  // Ottieni dal database l'elenco dei giochi supportati e costruisci la relativa
  // struttura dati da passare alla dashboard, dopo che sarà stata riempita
  const giochi = new Map();
  await db.allAsync("SELECT * FROM Giochi G").then( async (games) => {
    if (games === undefined || games.length == 0)
      return;

    for (let i = 0; i < games.length; i++) {
      let gioco = {                             // Oggetto 'gioco'
        nome: games[i].nome,
        nomeCompleto: games[i].nomeCompleto,
        logo: games[i].logo,
        iscritti: new Array()
      };

      giochi.set(gioco.nome, gioco);
    }
  });

  // Leggi dal database tutte le registrazioni e le relative informazioni dell'utente
  await db.allAsync("SELECT * FROM Registrazioni R, Utenti U AND U.userId = R.userId").then( async (users) => {
    if (users === undefined && users.length == 0) 
      return;

    // Processa l'elenco di iscrizioni, recuperando le informazioni degli utenti
    // e costruendo l'array di iscritti per ciascun gioco considerato
    for (let i = 0; i < users.length; i++) {
      await client.fetchUser(users[i].userId, true).then( (user) => {
        if (!user) return;
        else {
          let iscritto = {        // Oggetto 'iscritto'
            nome: user.tag,
            nickname: users[i].nickname,
            avatar: user.avatarURL ? user.avatarURL : "http://aicrew.it/qdss/img/icon_discord.png",
            status: 0
          };

          if (user.presence.status == 'online') iscritto.status = 1;
          else if (user.presence.status == 'idle') iscritto.status = 2;
          else if (user.presence.status == 'dnd') iscritto.status = 3;
          else if (user.presence.status == 'offline') iscritto.status = 4;

          // Aggiungi l'utente all'array di iscritti del relativo gioco
          const gioco = giochi.get(users[i].game);
          if (gioco !== undefined) gioco.iscritti.push(iscritto);
        }
      }).catch((err) => console.log(`User: ${err}`));
    }
  });

  const gamesParsed = JSON.stringify(giochi);
  res.render('giocatori', {games: gamesParsed, path: req.path});

  /*
  // Per ogni gioco nel database, recupera la lista degli iscritti e costruisci
  // un oggetto con le relative informazioni, da passare alla dashboard
  for (let i = 0; i < games.length; i++) {
    let gioco = {                             // Oggetto 'gioco'
      nome: games[i].nome,
      nomeCompleto: games[i].nomeCompleto,
      logo: games[i].logo,
      iscritti: new Array()
    };
    
    await db.allAsync("SELECT * FROM Giochi G, Registrazioni R, Utenti U " +
      "WHERE G.nome = R.game AND U.userId = R.userId AND R.game = ?", [gioco.nome])
    .then( async (users) => 
    {
      if (users === undefined && users.length == 0) 
        return;

      // Processa l'elenco di iscritti alla lista del gioco, recuperandone le informazioni
      for (let i = 0; i < users.length; i++) {
        var userId = users[i].userId;
        var user = await client.fetchUser(userId, true).catch((err) => console.log(`User: ${err}`));

        var iscritto = await new Promise(function getUser(resolve){
          if (!user) return;
          else {
            let iscritto = {        // Oggetto 'iscritto'
              nome: user.tag,
              nickname: users[i].nickname,
              avatar: user.avatarURL ? user.avatarURL : "http://aicrew.it/qdss/img/icon_discord.png",
              status: "0"
            };

            if (user.presence.status == 'online') iscritto.status = "1";
            else if (user.presence.status == 'idle') iscritto.status = "2";
            else if (user.presence.status == 'dnd') iscritto.status = "3";
            else if (user.presence.status == 'offline') iscritto.status = "4";
            
            resolve(iscritto);
          }
        });

        // Aggiungi l'utente all'array di iscritti al gioco corrente
        gioco.iscritti.push(iscritto);
      }
    });
    
    // Aggiungi il gioco corrente all'array che verrà usato per costruire la tabella
    giochi.push(gioco);
  }

  const gamesParsed = JSON.stringify(giochi);
  res.render('giocatori', {games: gamesParsed, path: req.path});
  */
});

user.post('/giocatori', (req, res, next) => {
    res.redirect('/qdss/giocatori'); 
});

user.get("/classifica", (req, res) => {
  const db = QDSS_DB.Open();
  db.allAsync("SELECT *, SUM(deltaRep) FROM Esperienza E LEFT JOIN Reputazione R ON E.userId = R.userTo GROUP BY E.userId")
  .then( async (rows) => {
    if (rows === undefined || rows.length == 0)
      return;

    const users = new Array();
    for (let i = 0; i < rows.length; i++) {
      // Si ottiene lo stato di presenza dell'utente e lo si inserisce nell'array corrispondente
      await client.fetchUser(rows[i].userId, true).then( (user) => {
        if (!user) return;

        var reputazione = rows[i]['SUM(deltaRep)'];
        var avatar = user.avatarURL ? user.avatarURL
          : "http://aicrew.it/qdss/img/icon_discord.png";

        users.push({tag: user.tag, avatar: avatar, level: rows[i].level, totalxp: rows[i].totalxp, levelxp: rows[i].levelxp, rep: reputazione});
      }).catch( (err) => console.log("User " + rows[i].userId + " doesn't exist anymore, " + err));
    }
    usersParsed = JSON.stringify(users);
    res.render('classifica', {users: usersParsed, path: req.path});
  })  
});

user.post('/classifica', (req, res) => {
  res.redirect('/qdss/classifica')
});

module.exports = user;