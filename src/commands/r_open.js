const Command = require("../base/Command.js");
const QDSS_DB = require("../util/qdss-sqlite.js");

const MAX_REQUEST_LENGTH = 250;


/****************************************************************************
*  Con il comando R_OPEN, un utente può proporre una modifica o richiedere	*
*  l'aggiunta di un gioco al QDSS-Bot										*
*   - la richiesta viene salvata nel database con un ID incrementale		*
*																			*
****************************************************************************/

class R_open extends Command {
  constructor(client) {
    super(client, {
      name: "r_open",
      description: "Avanza una richiesta per modifiche, aggiunta di giochi o feature al QDSS-Bot",
      category: "Miscellaneous",
      usage: "+richiesta <messaggio_richiesta>",
      aliases: ["richiesta", "r_apri", "r_open"],
      guildOnly: true
    });
  }

  async run(message, args, level) 
  {
    const author = message.author.tag;
    const requestMsg = args.join(" ");

    if (!requestMsg || /^\s*$/.test(requestMsg))    // Controlla che il messaggio non sia vuoto o abbia solo caratteri di spaziatura
    {
      message.reply("il messaggio della richiesta non può essere lasciato vuoto.");
      return;
    }
    else if (/(https?|ftp):\/\//i.test(requestMsg))    // Controlla che il messaggio non contenga URL
    {
      message.reply("il messaggio della richiesta non può contenere degli URL");
      return;
    }
    else if (requestMsg.length > MAX_REQUEST_LENGTH)      // Limite di caratteri sulla lunghezza della richiesta
    {
      message.reply("hai a disposizione un massimo di " + MAX_REQUEST_LENGTH + " caratteri per il messaggio della richiesta.");
      return;
    }

	const db = QDSS_DB.Open();
	
    // Inserimento della richiesta nell'apposita tabella del database
    db.runAsync("INSERT INTO Richieste (User, Messaggio, Status) VALUES (?,?, 'Open')", [author, requestMsg])
    .then( () => 
    {
      message.reply("la tua richiesta è stata inviata con successo e verrà presa in considerazione appena possibile.");
      db.close();
    })
    .catch( (err) => {
      db.close();
      message.reply("qualcosa è andato storto nell'invio della tua richiesta, riprova in un altro momento 😡");
      throw err;
    });

  }
}

module.exports = R_open;
