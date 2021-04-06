const Command = require("../../base/Command.js");
const tools = require("../../base/tools.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");


/************************************************************************************
*  Visualizza la top10 degli utenti in base alla quantità di esperienza accumulata	*
*  più un link alla pagina della dashboard con la classifica completa				*
*   - la risposta è formattata tramite code block in Discord utilizzando Markdown	*
*   - un array memorizza le emoticon da usare per ciascuna posizione				*
*																					*
************************************************************************************/

class Classifica extends Command {
  constructor(client) {
    super(client, {
      name: "classifica",
      description: "Mostra la classifica degli utenti in base all'esperienza accumulata",
      category: "Miscellaneous",
      usage: "+classifica",
      guildOnly: true,
      aliases: ["livelli", "levels", "leaderboard", "ranks"]
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
        message.reply ("il comando `+levels` non accetta nessun parametro aggiuntivo.");
        return;
    }

    db.allAsync("SELECT * FROM Esperienza E, Utenti U " +
        "WHERE E.userId = U.userId ORDER BY E.level DESC, E.levelxp DESC LIMIT 10")
    .then ( (rows) =>
    {
        if (!rows)
          return;
        let users_xp = "";
        
        for (let pos = 1; pos <= rows.length; pos++)
        {
            const user = rows[pos-1];
            const totalXp = tools.totalUserXP(user.level, user.levelxp);
            const exp = totalXp < 1000 ? totalXp.toString() : (totalXp / 1000).toFixed(1) + 'k';

            // Creazione della lista di stringhe da inviare nella risposta
            users_xp += `[${("0" + pos).slice(-2)}] ${emojis[pos-1]} `;			// [PX] emoji
            users_xp += `${user.username.slice(0, user.username.length-5)}`;	// username
            users_xp += " ".repeat(25 - (user.username.length - 5));			// tab (max 25 spazi)
            users_xp += `LIV. ${user.level}  (${exp} XP)\n`;					// livello (totalxp)
        }

        // Costruzione del messaggio di risposta, formattato all'interno di un codeblock
        const classifica = "```md\n#POS.    UTENTE                   LIVELLO (EXP)\n\n" + users_xp + "```\n" + 
            "Puoi visualizzare la classifica completa degli utenti di **Quei Due Sul Server** " +
            "al link http://www.aicrew.it/classifica. :wink:";

        return message.channel.send(classifica);
    })
    .then( () => db.close() )
    .catch( (err) => {
        db.close();
        throw err;
    });
	
  }
}

module.exports = Classifica;
