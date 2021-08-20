const Command = require("../base/Command.js");
const tools   = require("../base/tools.js");
const { Formatters } = require("discord.js");

	
/********************************************************************************
*  Il comando REQ_LIST visualizza tutte le richieste avanzate dagli utenti      *
*  e memorizzate nel database, filtrando solo quelle con Status = 'Open'        *
*   - l'elenco è formattato all'interno di un code block di Discord             *
*                                                                               *
********************************************************************************/

class Cmd_RequestList extends Command {
  constructor(client) {
    super(client, {
      name: "r_list",
      description: "Elenca tutte le richieste ancora aperte nei confronti del QDSS-Bot.",
      category: "Miscellaneous",
      usage: "+r_list",
      aliases: ["r_lista"],
      permLevel: "Bot Support",
	    guildOnly: true
    });
  }

  async run(message, args) 
  {
    const db = this.client.database.open();
    db.allAsync("SELECT * FROM Richieste WHERE Status = 'Open' ORDER BY RequestID ASC")
      .then( (rows) =>
      {
        if (!rows || rows.length == 0)
        {
          message.reply("Al momento non sono presenti richieste in sospeso per il QDSS-Bot.");
          return;
        }
        else 
        {
          let request_list = (rows.length > 1) ?
            `Sono presenti ${rows.length} richieste pendenti\n${"=".repeat(32)}\n\n` :
            `È presente 1 richiesta pendente\n${"=".repeat(32)}\n\n`;
              
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
              // Si invia il messaggio pieno e se ne inizia uno nuovo
              message.channel.send(Formatters.codeBlock("asciidoc", request_list));
              request_list = request;
            }
          }
          
          message.channel.send(Formatters.codeBlock("asciidoc", request_list));
        }

      }, (error) => 
      {
        message.reply("Impossibile accedere al database delle richieste. 🤬");
        throw error;
      })
      .catch( (error) => tools.logCommandError(this.client.logger, this, error))
      .finally( () => db.close() );
  }
}

module.exports = Cmd_RequestList;
