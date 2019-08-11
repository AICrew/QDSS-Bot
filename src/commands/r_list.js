const Command = require("../base/Command.js");
const QDSS_DB = require("../util/qdss-sqlite.js");
	
	
/********************************************************************************
*  Il comando REQ_LIST visualizza tutte le richieste avanzate dagli utenti		  *
*  e memorizzate nel database, filtrando solo quelle con Status = 'Open'		    *
*	- l'elenco è formattato all'interno di un code block di Discord				        *
*																				                                        *
********************************************************************************/

class R_list extends Command {
  constructor(client) {
    super(client, {
      name: "r_list",
      description: "Elenca tutte le richieste ancora aperte nei confronti del QDSS-Bot",
      category: "Miscellaneous",
      usage: "+r_list",
      aliases: ["r_lista"],
      permLevel: "Bot Support",
	  guildOnly: true
    });
  }

  async run(message, args, level) 
  {
    const db = QDSS_DB.Open();
    db.allAsync("SELECT * FROM Richieste WHERE Status = 'Open' ORDER BY RequestID ASC").then( (rows) =>
    {
      if (!rows || rows.length == 0)
      {
        message.reply("al momento non sono presenti richieste in sospeso per il QDSS-Bot.");
        return;
      }
      else 
      {
        let request_list = (rows.length > 1) ?
          "```asciidoc\nSono presenti " + rows.length + " richieste pendenti\n" + "=".repeat(32) + "\n\n" :
          "```asciidoc\nÈ presente 1 richiesta pendente\n" + "=".repeat(32) + "\n\n";
            
        // Creazione del messaggio formattato all'interno del code block
        for (let i = 0; i < rows.length; i++) 
        {
          const request = `(ID) ${rows[i].RequestID} - (Autore) ${rows[i].User}\n${rows[i].Messaggio}\n\n`;
          
          // Discord impone un limite di 2000 caratteri a messaggio, finchè si rientra
          // nel limite sicrea un unico messaggio concatenando le richieste
          if (request.length + request_list.length < 1950)
              request_list += request;
          else
          {
            request_list += "```";
            message.channel.send(request_list);	 		      // Si invia il messaggio pieno
            request_list = "```asciidoc\n" + request;     // e se ne inizia uno nuovo
          }
        }
        
        request_list += "```";
        return message.channel.send(request_list);
      }
    })
    .then( () => db.close() )
    .catch( (err) => {
      db.close();
      throw err;
    });
 
  }
}

module.exports = R_list;
