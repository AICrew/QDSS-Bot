const Command = require("../../base/Command.js");
const tools   = require("../../base/tools.js");


/****************************************************************************************
*  Rimuove un utente dalla lista dei giocatori a cui si era registrato in precedenza    *
*                                                                                       *
****************************************************************************************/

class Cmd_Abbandona extends Command {
  constructor(client) {
    super(client, {
      name: "abbandona",
      description: "Rimuove il proprio nome dalla lista del gioco specificato.",
      category: "Liste Giocatori",
      usage: "+abbandona <nome-gioco>",
      aliases: ["leave"],
      guildOnly: true
    });
  }

  async run(message, args) 
  {
    if (args.length == 0)
    {
      message.reply("È necessario indicare il nome di un gioco come secondo parametro del comando.");
      return;
    }

    const game = args.shift().toLowerCase();
    const userId = message.author.id;
  
    const db = this.client.database.open();
    db.getAsync("SELECT * FROM Registrazioni R, Giochi G WHERE R.game = G.nome AND game = ? AND userId = ?", [game, userId])
      .then( async (registration) => 
      {
        if (registration)
        {
          const gameName = registration.nomeCompleto;
          const role = await message.guild.roles.fetch(registration.ruolo);
          
          // Toglie all'utente il ruolo del gioco da cui si è cancellato
          if (role) message.member.roles.remove(role);

          // Eliminazione del record relativo alla registrazione dell'utente
          await db.runAsync("DELETE FROM Registrazioni WHERE game = ? AND userId = ?", [game, userId]);
          message.reply(`Sei stato eliminato con successo dalla lista di **${gameName}**.`);
        }
        else
        {
          // Il gioco non esiste oppure l'utente non è registrato ?
          const result = await db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game]);
          if (result)
            message.reply(`Non sei registrato alla lista di **${result.nomeCompleto}**.`);
          else message.reply(`Il gioco \`${game}\` non esiste o non ha ancora una lista.`);
        }
      })
      .catch( (error) => 
      {
        message.reply(`Si è verificato un errore durante l'esecuzione del comando. 🤬`);
        tools.logCommandError(this.client.logger, this, error);
      })
      .finally( () => db.close() );
  }
}

module.exports = Cmd_Abbandona;
