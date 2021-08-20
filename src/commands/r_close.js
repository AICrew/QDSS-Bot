const Command = require("../base/Command.js");
const tools   = require("../base/tools.js");


/****************************************************************************************
*  Con il comando R_CLOSE, un admin può marcare come 'Closed' una richiesta effettuata  *
*  da un utente per il QDSS-Bot, specificandone l'ID numerico                           *
*   - la richiesta viene mantenuta nel database ma non verrà più visualizzata           *
*                                                                                       *
****************************************************************************************/

class Cmd_RequestClose extends Command {
  constructor(client) {
    super(client, {
      name: "r_close",
      description: "Chiude una richiesta relativa al QDSS-Bot.",
      category: "Miscellaneous",
      usage: "+r_close <request_id>",
      aliases: ["r_chiudi"],
      permLevel: "Bot Admin",
	    guildOnly: true
    });
  }

  async run(message, args) 
  {
    const reqId = args.shift();
    if (reqId === undefined)
    {
      message.reply("È necessario specificare come parametro l'ID della richiesta da chiudere.");
      return;
    }
    
	  const db = this.client.database.open();
    db.getAsync("SELECT * FROM Richieste WHERE RequestID = ?", [reqId])
      .then( (row) => 
      {
        if (row && row.Status === 'Open')
        {
          // Aggiornamento della entry per marcarla con lo stato 'Closed'
          db.runAsync("UPDATE Richieste SET Status = 'Closed' WHERE RequestID = ?", [reqId])
            .then(() => message.reply(`La richiesta con ID = ${reqId} è stata chiusa correttamente.`),
              (error) => {
                message.reply(`Si è verificato un errore durante la chiusura della richiesta. 🤬`);
                throw error;
              });
        }
        else if (row && row.Status === 'Closed')
        {
          message.reply(`La richiesta con ID = ${reqId} risulta essere già stata chiusa in precedenza.`);
        }
        else {
          message.reply(`Non esiste nessuna richiesta corrispondente all'ID: ${reqId}`);
        }
      }, (error) => {
        message.reply(`Impossibile accedere al database delle richieste. 🤬`);
        throw error;
      })
      .catch( (error) => tools.logCommandError(this.client.logger, this, error))
      .finally( () => db.close() );
  }
}

module.exports = Cmd_RequestClose;
