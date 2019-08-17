const Command = require("../../base/Command.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");


/****************************************************************************************
*  The QUERY command is used to forward SQL queries (the concatenation of command		    *
*  arguments) and execute them on the database, returning a message with the records	  *
*  selected by the query or an error message if the operation failed.					          *
*																						                                            *
****************************************************************************************/

class Query extends Command {
  constructor(client) {
    super(client, {
      name: "query",
      description: "Executes an SQL query on the database, with admin privileges",
      category: "System",
      usage: "+query <SQL code>",
      permLevel: "Bot Admin"
    });
  }

  async run(message, args, level) {
  
	  // Apertura della connessione al DB ed esecuzione della query contenuta nel messaggio
	  const query = args.join(" ");
    const db = QDSS_DB.Open();
	
    db.allAsync(query).then( (rows) => 
    {
      message.channel.send("La query è stata eseguita con successo.");
          
      // Se la query non ha prodotto risultati, si termina
      if (rows === undefined || rows.length == 0)
        return;
      
      let results = "```json\n";
      for (let i = 0; i < rows.length; i++)
      {
        // Discord impone un limite di 2000 caratteri a messaggio, finchè
        // si rientra nel limite si concatenano le tuple ritornate dalla query
        let row = JSON.stringify(rows[i]) + "\n";
        if (row.length + results.length < 1950)
          results += row;
        else
        {
          results += "```";
          message.channel.send(results);    // Si invia il messaggio pieno
          results = "```json\n" + row;      // e se ne inizia uno nuovo
        }
      }
          
      results += "```";
      return message.channel.send(results);
    })
    .then( () => db.close() )
    .catch( (err) => {
      db.close();
      message.channel.send(err.toString());
    });

  }
}

module.exports = Query;
