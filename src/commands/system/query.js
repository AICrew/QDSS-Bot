const Command = require("../../base/Command.js");
const tools   = require("../../base/tools.js");
const { Formatters } = require("discord.js");


/****************************************************************************************
*  The QUERY command is used to forward SQL queries (the concatenation of command       *
*  arguments) and execute them on the database, returning a message with the records    *
*  selected by the query or an error message if the operation failed.                   *
*                                                                                       *
****************************************************************************************/

class Cmd_Query extends Command {
  constructor(client) {
    super(client, {
      name: "query",
      description: "Executes an SQL query on the database, with admin privileges.",
      category: "System",
      usage: "+query <SQL code>",
      permLevel: "Bot Admin"
    });
  }

  async run(message, args) {
  
    // Open the database connection and execute the query contained in the message
    const query = args.join(" ");
    const db = this.client.database.open();
    
    db.allAsync(query)
      .then( (rows) => 
      {
        message.channel.send("La query è stata eseguita con successo.");
            
        // If the query produced no results, terminate.
        if (rows === undefined || rows.length == 0)
          return;
        
        let results = "";
        for (let i = 0; i < rows.length; i++)
        {
          // Discord imposes a 2000 characters limit on each message,
          // concatenate returned tuples until there's no room left.
          let row = JSON.stringify(rows[i]) + "\n";
          if (row.length + results.length < 1950)
            results += row;
          else
          {
            // Send the filled-up message and begin a new one.
            message.channel.send(Formatters.codeBlock("json", results));
            results = row;
          }
        }
        
        message.channel.send(Formatters.codeBlock("json", results));

      }, (error) => 
      {
        message.channel.send(`Errore durante l'esecuzione della query. ${error.message}`);
        throw error;
      })
      .catch( (error) => tools.logCommandError(this.client.logger, this, error) )
      .finally( () => db.close() );
  }
}

module.exports = Cmd_Query;
