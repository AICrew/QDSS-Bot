const Command = require("../base/Command.js");
const tools   = require("../base/tools.js");

const MAX_REQUEST_LENGTH = 250;


/****************************************************************************
*  Con il comando R_OPEN, un utente può proporre una modifica o richiedere  *
*  l'aggiunta di un gioco al QDSS-Bot                                       *
*   - la richiesta viene salvata nel database con un ID incrementale        *
*                                                                           *
****************************************************************************/

class Cmd_RequestOpen extends Command {
  constructor(client) {
    super(client, {
      name: "r_open",
      description: "Avanza una richiesta per modifiche, aggiunta di giochi o feature al QDSS-Bot.",
      category: "Miscellaneous",
      usage: "+richiesta <messaggio_richiesta>",
      aliases: ["richiesta", "r_apri", "r_open"],
      guildOnly: true
    });
  }

  async run(message, args) 
  {
    const author = message.author.tag;
    const requestMsg = args.join(" ");

    if (!requestMsg || /^\s*$/.test(requestMsg))    // Controlla che il messaggio non sia vuoto o abbia solo caratteri di spaziatura
    {
      message.reply("Il messaggio della richiesta non può essere lasciato vuoto.");
      return;
    }
    else if (/(https?|ftp):\/\//i.test(requestMsg))    // Controlla che il messaggio non contenga URL
    {
      message.reply("Il messaggio della richiesta non può contenere degli URL");
      return;
    }
    else if (requestMsg.length > MAX_REQUEST_LENGTH)      // Limite di caratteri sulla lunghezza della richiesta
    {
      message.reply(`La lunghezza massima disponibile per il messaggio della richiesta è di ${MAX_REQUEST_LENGTH} caratteri.`);
      return;
    }

    // Inserimento della richiesta nell'apposita tabella del database
    const db = this.client.database.open();
    db.runAsync("INSERT INTO Richieste (User, Messaggio, Status) VALUES (?,?, 'Open')", [author, requestMsg])
      .then(() => message.reply("La richiesta è stata inviata con successo e verrà presa in considerazione appena possibile."),
        (error) => {
          message.reply("Qualcosa è andato storto durante l'invio della richiesta. 🤬");
          throw error;
      })
      .catch( (error) => tools.logCommandError(this.client.logger, this, error))
      .finally( () => db.close() );
  }
}

module.exports = Cmd_RequestOpen;
