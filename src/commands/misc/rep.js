const Command = require("../../base/Command.js");
const tools   = require("../../base/tools.js");


/****************************************************************************************
*  Il comando REP permette ad un utente di assegnare un punto reputazione a un membro   *
*  del server che si ritiene meritevole, tramite menzione                               *
*   - il DB memorizza un record per ciascuna transazione di rep tra coppie di utenti    *
* 	- un timestamp permette di imporre il vincolo che ogni giorno l'utente A può        *
*     assegnare solamente un punto reputazione all'utente B                             *
*                                                                                       *
****************************************************************************************/

class Cmd_Rep extends Command {
  constructor(client) {
    super(client, {
      name: "rep",
      description: "Assegna un punto reputazione ad un utente ritenuto meritevole.",
      category: "Miscellaneous",
      usage: "+rep @utente",
      aliases: ["giverep", "thank", "ringrazia"],
      guildOnly: true
    });
  }

  async run(message, args) 
  {
    const mention = message.mentions.members.first();
    if (!mention)
    {
      message.reply("È necessario menzionare un utente valido.");
      return;
    }
    
    const mentionedUser = mention.user;
    if (mentionedUser === message.author)
    {
      message.reply(`**${message.author.tag}** crede di essere furbo... *nice try \\;)*`);
    }
    else if (mentionedUser.bot)
    {
      message.reply("Non è possibile assegnare punti reputazione a un bot... *basta il pensiero*");
    }
    else
    {
      const userFromId = message.author.id;
      const userFromTag = message.author.tag;
      const userToId = mentionedUser.id;
      const userToTag = mentionedUser.tag;
      
      const db = this.client.database.open();
      db.insertUserIfNotExists(userFromId, userFromTag)
        .then( () =>
        {
          return db.insertUserIfNotExists(userToId, userToTag)
        })
        .then( () =>
        {
          return db.getAsync("SELECT * FROM Reputazione WHERE userFrom = ? ORDER BY timestamp DESC", [userFromId]);
        })
        .then( async (result) =>
        {
          if (result)
          {
            const current = new Date();
            const last = new Date(result.timestamp);
            
            // Confronto tra data attuale e quella individuata dal timestamp
            if (tools.isSameDay(current, last))
              message.reply("Non è possibile assegnare più di 1 punto reputazione al giorno.");
          }

          await db.runAsync("INSERT INTO Reputazione (userFrom, userTo, timestamp, deltaRep) " +
            "VALUES (?, ?, ?, ?)", [userFromId, userToId, Date.now(), 1]);
            
          message.reply(`È stato assegnato **1 punto reputazione** all'utente **${userToTag}**`);
        })
        .catch( (error) => tools.logCommandError(this.client.logger, this, error) )
        .finally( () => db.close() );
    }
  }
}

module.exports = Cmd_Rep;
