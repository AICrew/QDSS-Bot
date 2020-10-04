const Command = require("../../base/Command.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");


/****************************************************************************************
*  Rimuove un utente dalla lista dei giocatori a cui si era registrato in precedenza	*
*																						*
****************************************************************************************/

class Abbandona extends Command {
  constructor(client) {
    super(client, {
      name: "abbandona",
      description: "Rimuove il proprio nome dalla lista del gioco specificato",
      category: "Liste Giocatori",
      usage: "+abbandona <nome-gioco>",
      aliases: ["leave"],
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
		const userId = message.author.id;
	
    const db = QDSS_DB.Open();
		db.getAsync("SELECT * FROM Registrazioni R, Giochi G WHERE R.game = G.nome AND game = ? AND userId = ?", [game, userId])
		.then( async (registration) => 
		{
			if (registration)
			{
				const gameName = registration.nomeCompleto;
				const role = message.guild.roles.cache.find(role => role.name === gameName);
				
				if (role)
					message.member.roles.remove(role);    // Toglie all'utente il ruolo del gioco da cui si è cancellato

				// Eliminazione del record relativo alla registrazione dell'utente
				await db.runAsync("DELETE FROM Registrazioni WHERE game = ? AND userId = ?", [game, userId]);
				return message.reply("sei stato eliminato dalla lista di " + gameName);
			}
			else
			{
				// Il gioco non esiste oppure l'utente non è registrato ?
				const result = await db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game]);
				if (result)
					return message.reply("non sei nella lista di " + result.nomeCompleto);
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

module.exports = Abbandona;
