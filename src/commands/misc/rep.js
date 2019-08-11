const Command = require("../../base/Command.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");
const tools = require("../../base/tools.js");


/****************************************************************************************
*  Il comando REP permette ad un utente di assegnare un punto reputazione a un membro	*
*  del server che si ritiene meritevole, tramite menzione								*
*   - il DB memorizza un record per ciascuna transazione di rep tra coppie di utenti	*
* 	- un timestamp permette di imporre il vincolo che ogni giorno l'utente A può 		*
*	  assegnare solamente un punto reputazione all'utente B 							*
*																						*
****************************************************************************************/

class Rep extends Command {
  constructor(client) {
    super(client, {
      name: "rep",
      description: "Assegna un punto reputazione ad un utente ritenuto meritevole",
      category: "Miscellaneous",
      usage: "+rep @utente",
      aliases: ["giverep", "thank", "ringrazia"],
	  	guildOnly: true
    });
  }

  async run(message, args, level) 
  {
    const mention = message.mentions.members.first();
	if (mention === undefined)
	{
		message.channel.send("È necessario menzionare un utente valido");
		return;
	}
	
	const mentionedMember = mention.user;
	if (mentionedMember === message.author)
	{
		message.channel.send("**" + message.author.tag + "** crede di essere furbo... *nice try \\;)*");
	}
	else
	{
		const userFromId = message.author.id;
		const userFromTag = message.author.tag;
		const userToId = mentionedMember.id;
		const userToTag = mentionedMember.tag;
		
		const db = QDSS_DB.Open();
		
		db.insertUserIfNotExists(userFromId, userFromTag)
		.then( () =>
		{
			return db.insertUserIfNotExists(userToId, userToTag)
		})
		.then( () =>
		{
			return db.getAsync("SELECT * FROM Reputazione WHERE userFrom = ? AND userTo = ? ORDER BY timestamp DESC", [userFromId, userToId]);
		})
		.then( async (result) =>
		{
			if (result)
			{
				const current = new Date();					// Confronto tra data attuale e quella individuata dal timestamp
				const last = new Date(result.timestamp);
				
				if (tools.isSameDay(current, last))
					return message.channel.send("Non è possibile assegnare più di 1 punto reputazione al giorno alla stessa persona");
			}

			await db.runAsync("INSERT INTO Reputazione (userFrom, userTo, timestamp, deltaRep) " +
				"VALUES (?, ?, ?, ?)", [userFromId, userToId, Date.now(), 1]);
				
			return message.channel.send("È stato assegnato **1 punto reputazione** all'utente **" + userToTag + "**");
		})
		.then( () => db.close() )
		.catch( (err) => {
			db.close();
			throw err;
		});
	}
	
  }
}

module.exports = Rep;
