const Command = require("../../base/Command.js");
const tools   = require("../../base/tools.js");
	
const MAX_NICKNAME_LENGTH = 32;


/********************************************************************************************
*  Tramite il comando NICKNAME, un utente può aggiungere (o modificare, se già presente)    *
*  il proprio nickname in-game per il gioco specificato alla cui lista deve essersi         *
*  precedentemente registrato                                                               *
*                                                                                           *
********************************************************************************************/

class Cmd_Nickname extends Command {
  constructor(client) {
    super(client, {
      name: "nickname",
      description: "Aggiungi o modifica il nickname associato all'account di gioco registrato.",
      category: "Liste Giocatori",
      usage: "+nickname <nome-gioco> <nickname-in-gioco>",
      aliases: ["nick"],
      guildOnly: true
    });
  }

  async run(message, args) 
  {
    if (args.length == 0)
    {
      message.reply("È necessario indicare il nome di un gioco come secondo parametro del comando.");
      return;
    }
  
    const game = args.shift().toLowerCase();
    const nickname = args.join(" ");
    const userId = message.author.id;
  
    if (!nickname || /^\s*$/.test(nickname))    	// Controlla che il nickname non sia vuoto o abbia solo caratteri di spaziatura
    {
      message.reply("È necessario specificare un nickname da registrare nella lista.");
      return;
    }
    else if (/(https?|ftp):\/\//i.test(nickname))		// Controlla che il nickname non contenga URL
    {
      message.reply("Il nickname fornito non può contenere URL o collegamenti web.");
      return;
    }
    else if (nickname.length > MAX_NICKNAME_LENGTH)		// Controllo lunghezza del nickname
    {
      message.reply(`Il nickname fornito eccede la lunghezza massima supportata di ${MAX_NICKNAME_LENGTH} caratteri.`);
      return;
    }

    const db = this.client.database.open();
    db.getAsync("SELECT * FROM Registrazioni R, Giochi G WHERE R.game = G.nome AND userId = ? AND R.game = ?", [userId, game])
      .then( async (row) => 
      {
        if (row) 
        {
          // Aggiornamento del nickname per l'account registrato
          await db.run("UPDATE Registrazioni SET nickname = ? WHERE userId = ? AND game = ?", [nickname, userId, game]);
          message.reply(`Hai registrato il nickname *${nickname}* per la lista di **${row.nomeCompleto}**.`);
        }
        else
        {
          // Il gioco non esiste oppure l'utente non è registrato ?
          const result = await db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game]);
          if (result)
            message.reply("Devi essere iscritto alla lista per poter registrare un nickname."); 
          else message.reply(`Il gioco \`${game}\` non esiste o non ha ancora una lista.`);
        }
      })
      .catch( (error) => 
      {
        message.reply(`Si è verificato un errore durante l'esecuzione del comando. 🤬`);
        tools.logCommandError(this.client.logger, this, error);
      })
      .finally( () => db.close() );
  }
}

module.exports = Cmd_Nickname;
