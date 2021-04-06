const Command = require("../../base/Command.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");
	
const MAX_NICKNAME_LENGTH = 32;


/********************************************************************************************
*  Tramite il comando NICKNAME, un utente può aggiungere (o modificare, se già presente)	*
*  il proprio nickname in-game per il gioco specificato alla cui lista deve essersi			*
*  precedentemente registrato																*
*																							*
********************************************************************************************/

class Nickname extends Command {
  constructor(client) {
    super(client, {
      name: "nickname",
      description: "Modifica il nickname associato all'account di gioco registrato",
      category: "Liste Giocatori",
      usage: "+nickname <nome-gioco> <nickname-in-gioco>",
      aliases: ["nick"],
      guildOnly: true
    });
  }

  async run(message, args, level) 
  {
    if (args.length == 0)
    {
      message.reply("devi indicare il nome di un gioco come secondo parametro del comando.");
      return;
    }
	
    const game = args.shift().toLowerCase();
	const nickname = args.join(" ");
    const userId = message.author.id;
	
	if (!nickname || /^\s*$/.test(nickname))    	// Controlla che il nickname non sia vuoto o abbia solo caratteri di spaziatura
    {
      message.reply("devi specificare un nickname da registrare nella lista.");
      return;
    }
    else if (/(https?|ftp):\/\//i.test(nickname))		// Controlla che il nickname non contenga URL
    {
      message.reply("il nickname non può contenere degli URL");
      return;
    }
    else if (nickname.length > MAX_NICKNAME_LENGTH)		// Controllo lunghezza del nickname
    {
      message.reply("hai a disposizione un massimo di " + MAX_NICKNAME_LENGTH + " caratteri per nickname e informazioni aggiuntive.");
      return;
    }

    const db = QDSS_DB.Open();
    db.getAsync("SELECT * FROM Registrazioni R, Giochi G WHERE R.game = G.nome AND userId = ? AND R.game = ?", [userId, game])
    .then( async (row) => 
    {
      if (row) 
      {
		// Aggiornamento del nickname per l'account registrato
        await db.run("UPDATE Registrazioni SET nickname = ? WHERE userId = ? AND game = ?", [nickname, userId, game]);
        return message.reply("hai registrato per la lista di " + row.nomeCompleto + " il tuo nickname: " + nickname);
      }
      else
      {
        // Il gioco non esiste oppure l'utente non è registrato ?
        const result = await db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game]);
        if (result)
          return message.reply("devi essere iscritto alla lista per poter registrare un nickname"); 
        else return message.reply("il gioco `" + game + "` non esiste o non ha ancora una lista.");
      }
    })
    .then( () => db.close() )
    .catch( (err) => {
      db.close();
      throw err;
    });

  }
}

module.exports = Nickname;
