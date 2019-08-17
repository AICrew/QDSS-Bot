const Command = require("../base/Command.js");
const QDSS_DB = require("../util/qdss-sqlite.js");


/****************************************************************************************
*  Con il comando R_CLOSE, un admin può marcare come 'Closed' una richiesta effettuata	*
*  da un utente per il QDSS-Bot, specificandone l'ID numerico							              *
*	- la richiesta viene mantenuta nel database ma non verrà più visualizzata			        *
*																						                                            *
****************************************************************************************/

class R_close extends Command {
  constructor(client) {
    super(client, {
      name: "r_close",
      description: "Chiude una richiesta relativa al QDSS-Bot",
      category: "Miscellaneous",
      usage: "+r_close <request_id>",
      aliases: ["r_chiudi"],
      permLevel: "Bot Admin",
	    guildOnly: true
    });
  }

  async run(message, args, level) 
  {
    const reqId = args.shift();
    if (reqId === undefined)
    {
      message.reply("devi specificare come parametro l'ID della richiesta da chiudere.");
      return;
    }
    
	  const db = QDSS_DB.Open();
    db.getAsync("SELECT * FROM Richieste WHERE RequestID = ?", [reqId]).then( async (row) => 
	  {
      if (row && row.Status === 'Open')
      {
        // Aggiornamento della entry per marcarla con lo stato 'Closed'
        await db.runAsync("UPDATE Richieste SET Status = 'Closed' WHERE RequestID = ?", [reqId]);
		    message.reply(`la richiesta con ID = ${reqId} è stata chiusa correttamente.`);
      }
      else if (row && row.Status === 'Closed')
      {
        message.reply(`la richiesta con ID = ${reqId} risulta già chiusa in precedenza.`);
      }
      else message.reply(`non esiste nessuna richiesta corrispondente all'ID: ${reqId}`);
		
		  db.close();
    })
    .catch( (err) => {
      db.close();
      throw err;
	  });
	
  }
}

module.exports = R_close;
