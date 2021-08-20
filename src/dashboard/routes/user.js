const dotenv = require('dotenv');
dotenv.config({path: '../../.env'});
const express = require('express');
const user = express.Router();
const passwordProtected = require('express-password-protect');
const dashboard = require('../dashboard-client.js');


// User
const User = {
  username: process.env.USER,
  password: process.env.UserPassword,
  maxAge: 86400000 // 1 day
};

//user.use(passwordProtected(User));

user.get("/giocatori", async (req, res) => {
  
  const giochi = new Map();

  // Ottieni dal database l'elenco dei giochi supportati e costruisci la relativa
  // struttura dati da passare alla dashboard, dopo che sarà stata riempita
  const db = dashboard.client.database.open();
  await db.allAsync("SELECT * FROM Giochi G")
    .then( (games) => 
    {
      if (games === undefined || games.length == 0)
        return;

      for (let i = 0; i < games.length; i++) 
      {
        let gioco = {                             // Oggetto 'gioco'
          nome: games[i].nome,
          nomeCompleto: games[i].nomeCompleto,
          logo: games[i].logo,
          iscritti: new Array()
        };

        giochi.set(gioco.nome, gioco);
      }
    })
    .catch( (error) => console.error(error.message));

  // Leggi dal database tutte le registrazioni e le relative informazioni dell'utente
  await db.allAsync("SELECT * FROM Registrazioni R, Utenti U WHERE U.userId = R.userId")
    .then( async (users) => 
    {
      if (users === undefined && users.length == 0) 
        return;

      // Processa l'elenco di iscrizioni, recuperando le informazioni degli utenti
      // e costruendo l'array di iscritti per ciascun gioco considerato
      for (let i = 0; i < users.length; i++) 
      {
        await dashboard.client.guilds.cache.first().members
          .fetch(users[i].userId, true)
          .then( (member) => 
          {
            if (!member) return;
            else 
            {
              let iscritto = {        // Oggetto 'iscritto'
                nome: member.user.tag,
                nickname: users[i].nickname,
                avatar: member.user.avatarURL() ? member.user.avatarURL() : "http://aicrew.it/qdss/img/icon_discord.png",
                status: 0
              };

              const status = member.presence ? member.presence.status : "offline";
              if (status === 'online') iscritto.status = 1;
              else if (status === 'idle') iscritto.status = 2;
              else if (status === 'dnd') iscritto.status = 3;
              else if (status === 'offline') iscritto.status = 4;

              // Aggiungi l'utente all'array di iscritti del relativo gioco
              const gioco = giochi.get(users[i].game);
              if (gioco !== undefined) gioco.iscritti.push(iscritto);
            }
          }).catch( (error) => console.error(error.message));
      }
    });

  const gamesParsed = JSON.stringify(Array.from(giochi.values()));
  res.render('giocatori', { games: gamesParsed, path: req.path });
});

user.post('/giocatori', (req, res, next) => {
  res.redirect('/qdss/giocatori'); 
});


user.get("/classifica", (req, res) => {

  const db = dashboard.client.database.open();
  db.allAsync("SELECT *, SUM(deltaRep) FROM Esperienza E LEFT JOIN Reputazione R ON E.userId = R.userTo GROUP BY E.userId")
    .then( async (rows) => 
    {
      if (rows === undefined || rows.length == 0)
        return;

      const users = new Array();
      for (let i = 0; i < rows.length; i++) 
      {
        // Si ottengono le informazioni per ciascun utente
        await dashboard.client.users.fetch(rows[i].userId, true)
          .then( (user) => 
          {
            if (!user) return;
            else
            {
              const reputazione = rows[i]['SUM(deltaRep)'] ? rows[i]['SUM(deltaRep)'] : 0;
              const avatar = user.avatarURL() ? user.avatarURL() : "http://aicrew.it/qdss/img/icon_discord.png";
  
              users.push({ 
                tag: user.tag,
                avatar: avatar,
                level: rows[i].level,
                totalxp: rows[i].totalxp,
                levelxp: rows[i].levelxp,
                rep: reputazione
              });
            }
          }).catch( (error) => console.log(`User ${rows[i].userId} doesn't exist anymore, ${error.message}`));
      }
      usersParsed = JSON.stringify(users);
      res.render('classifica', { users: usersParsed, path: req.path });

    }).catch( (error) => console.error(error.message));
});

user.post('/classifica', (req, res) => {
  res.redirect('/qdss/classifica')
});

module.exports = user;
