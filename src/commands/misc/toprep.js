const Command = require("../../base/Command.js");
const tools   = require("../../base/tools.js");
const { Formatters } = require("discord.js");

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


/************************************************************************************
*  Visualizza la classifica degli utenti ordinati in base alla reputazione          *
*   - la risposta è formattata tramite code block in Discord utilizzando Markdown   *
*   - un array memorizza le emoticon da usare per ciascuna posizione                *
*                                                                                   *
************************************************************************************/

class Cmd_Toprep extends Command {
  constructor(client) {
    super(client, {
      name: "toprep",
      description: "Mostra la classifica dei 10 utenti con la reputazione più alta.",
      category: "Miscellaneous",
      usage: "+toprep",
      guildOnly: true
    });
  }

  async run(message, args)
  {
    if (args.length !== 0)
    {
      message.reply("Il comando `+toprep` non accetta nessun parametro aggiuntivo.");
      return;
    }

    const db = this.client.database.open();
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
            {
              pos = i+1;  // Indice di posizione
              lastRep = rows[i].rep;
            }

            // Creazione della lista di stringhe da inviare nella risposta
            users_rep += `${emojis[pos-1]} #${("0" + pos).slice(-2)}: `;    // emoji #PX:
            users_rep += " ".repeat(4 - rows[i].rep.toString().length);     // tab (max 4 spaces)
            users_rep += `${rows[i].rep} - ${rows[i].username}\n`;          // rep - username
          }
        
          // Costruzione del messaggio di risposta, formattato all'interno di un codeblock
          const classifica = Formatters.codeBlock("md", `#POS. -- REP -- UTENTE\n\n${users_rep}`);
          message.channel.send(classifica);
        }
      }, (error) => 
      {
        message.reply(`Si è verificato un errore durante l'elaborazione della classifica. 🤬`);
        throw error;
      })
      .catch( (error) => tools.logCommandError(this.client.logger, this, error) )
      .finally( () => db.close() );
  }
}

module.exports = Cmd_Toprep;
