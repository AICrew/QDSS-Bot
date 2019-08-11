const Command = require("../../base/Command.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");


/************************************************************************************
*  Visualizza la classifica degli utenti ordinati in base alla reputazione			*
*   - la risposta è formattata tramite code block in Discord utilizzando Markdown	*
*   - un array memorizza le emoticon da usare per ciascuna posizione				*
*																					*
************************************************************************************/

class Toprep extends Command {
  constructor(client) {
    super(client, {
      name: "toprep",
      description: "Mostra la classifica dei 10 utenti con la reputazione pi� alta",
      category: "Miscellaneous",
      usage: "+toprep",
      guildOnly: true
    });
  }

  async run(message, args, level)
  {
		const db = QDSS_DB.Open();
		const emojis = [
			'\uD83E\uDD47',	 // :first_place:
			'\uD83E\uDD48',	 // :second_place:
			'\uD83E\uDD49',	 // :third_place:
			'\uD83D\uDC49',	 // :point_right:
			'\uD83D\uDC49',	 // :point_right:
			'\uD83D\uDC49',	 // :point_right:
			'\uD83D\uDC49',	 // :point_right:
			'\uD83D\uDC49',	 // :point_right:
			'\uD83D\uDC49',	 // :point_right:
			'\uD83D\uDC49']	 // :point_right:
	
    if (args.length !== 0)
    {
		db.close();
		message.reply ("il comando `+toprep` non accetta nessun parametro aggiuntivo.");
		return;
    }

	db.allAsync("SELECT username, SUM(deltaRep) AS rep FROM Reputazione R, Utenti U " +
		"WHERE R.userTo = U.userId GROUP BY userTo ORDER BY rep DESC LIMIT 10")
	.then ( (rows) =>
	{
		if (rows && rows.length > 0) 
		{
			let users_rep = "";
			let lastRep = -1, pos = 0;
			
			for (let i = 0; i < rows.length; i++)
			{
				if (rows[i].rep != lastRep)
				{								// Indice di posizione
					pos = i+1;
					lastRep = rows[i].rep;
				}

				// Creazione della lista di stringhe da inviare nella risposta
				users_rep += `${emojis[pos-1]} #${("0" + pos).slice(-2)}: `;		// emoji #PX:
				users_rep += " ".repeat(4 - rows[i].rep.toString().length);			// tab (max 4 spaces)
				users_rep += `${rows[i].rep} - ${rows[i].username}\n`;				// rep - username
			}
		
			// Costruzione del messaggio di risposta, formattato all'interno di un codeblock
			const classifica = "```md\n#POS. -- REP -- UTENTE\n\n" + users_rep + "```";
			return message.channel.send(classifica);
		}
	})
	.then( () => db.close() )
	.catch( (err) => {
		db.close();
		throw err;
	});
	
  }
}

module.exports = Toprep;
