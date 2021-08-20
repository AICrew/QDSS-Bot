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
*  Visualizza la top10 degli utenti in base alla quantità di esperienza accumulata  *
*  più un link alla pagina della dashboard con la classifica completa               *
*   - la risposta è formattata tramite code block in Discord utilizzando Markdown   *
*   - un array memorizza le emoticon da usare per ciascuna posizione                *
*                                                                                   *
************************************************************************************/

class Cmd_Classifica extends Command {
  constructor(client) {
    super(client, {
      name: "classifica",
      description: "Mostra la classifica degli utenti in base all'esperienza accumulata.",
      category: "Miscellaneous",
      usage: "+classifica",
      guildOnly: true,
      aliases: ["livelli", "levels", "leaderboard", "ranks"]
    });
  }

  async run(message, args)
  {
    if (args.length !== 0)
    {
      message.reply("Il comando `+classifica` non accetta nessun parametro aggiuntivo.");
      return;
    }

    const db = this.client.database.open();
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
            users_xp += `[${("0" + pos).slice(-2)}] ${emojis[pos-1]} `;			  // [PX] Emoji
            users_xp += `${user.username.slice(0, user.username.length-5)}`;  // Username
            users_xp += " ".repeat(25 - (user.username.length - 5));          // Tab (max 25 spazi)
            users_xp += `LIV. ${user.level}  (${exp} XP)\n`;                  // Livello (totalxp)
        }

        // Costruzione del messaggio di risposta, formattato all'interno di un codeblock
        const classifica = Formatters.codeBlock("md", `#POS.    UTENTE                   LIVELLO (EXP)\n\n${users_xp}`) + 
            "\nPuoi visualizzare la classifica completa degli utenti di **Quei Due Sul Server** " +
            "al link http://www.aicrew.it/qdss/classifica. :wink:";

        message.channel.send(classifica);

      }, (error) => 
      {
        message.reply(`È stato riscontrato un errore durante l'elaborazione della classifica. 🤬`);
        throw error;
      })
      .catch( (error) => tools.logCommandError(this.client.logger, this, error) )
      .finally( () => db.close() );
  }
}

module.exports = Cmd_Classifica;
