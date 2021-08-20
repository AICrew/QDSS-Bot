const Command = require("../base/Command.js");
const tools   = require("../base/tools.js");
const { MessageEmbed } = require("discord.js");


/********************************************************************************************
* Il comando PROFILO mostra una scheda riassuntiva del profilo di un utente, comprensiva    *
* di: Stato (online, afk, ...), Livello e XP, Reputazione ed elenco dei giochi per i        *
* quali l'utente ha registrato un account alla relativa lista                               *
*   - l'utente è selezionato tramite menzione o, se omesso, si assume l'autore del comando  *
*   - l'elenco è formattato all'interno di un MessageEmbed di Discord                       *
*                                                                                           *
********************************************************************************************/

class Cmd_Profilo extends Command {
  constructor(client) {
    super(client, {
      name: "profilo",
      description: "Mostra il profilo di un utente (XP, Reputazione, Giochi)",
      category: "Liste Giocatori",
      usage: "+profilo",
      aliases: ["profile", "rank"],
	    guildOnly: true
    });
  }

  async run(message, args) 
  {
    let targetMember = message.mentions.members.first();
    if (!targetMember)
    {
      const param = args.shift();
      if (param)
      {
        message.reply(`\`${param}\` non è un parametro valido per il comando \`+profilo\`.` +
          ` Per visualizzare il profilo di un utente è sufficiente menzionarlo nel comando,` +
          ` altrimenti usare semplicemente \`+profilo\` per mostrare le proprie informazioni.`);
        return;
      }
      else targetMember = message.member;		// By default, il profilo mostrato è quello di chi esegue il comando
    }
    
    const userId = targetMember.id;
    const username = targetMember.user.tag;
    const status = targetMember.presence ? targetMember.presence.status : "offline";
    let giochi = " ----- \n", nicknames = " -------- \n",
      statusIcon, livello, reputazione;
      
    if (status === "online") 
      statusIcon = "https://cdn.discordapp.com/emojis/499667720430682114.png";    // Icona stato Online
    else if (status === "idle")
      statusIcon = "https://cdn.discordapp.com/emojis/499667640969723914.png";    // Icona stato AFK
    else if (status === "dnd")
      statusIcon = "https://cdn.discordapp.com/emojis/499667667855212564.png";    // Icona stato Busy
    else if (status == "offline")
      statusIcon = "https://cdn.discordapp.com/emojis/499667690986668075.png";    // Icona stato Offline
    
    
    const db = this.client.database.open();
    db.insertUserIfNotExists(userId, username)
      .then( () => 
      {
        return db.getAsync("SELECT SUM(deltaRep) AS rep FROM Reputazione WHERE userTo = ?", [userId])		// QUERY REPUTAZIONE
      })
      .then( (result) => 
      {
        reputazione = result.rep == null ? 0 : result.rep;
        return db.getAsync ("SELECT * FROM Esperienza WHERE userId = ?", [userId]); 	// QUERY XP/LIVELLI
      })
      .then( (row) => 
      {
        if (row)
        {
          const nextLevelXp = tools.levelUpXP(row.level + 1);
          const filledSquares = Math.floor((row.levelxp / nextLevelXp) * 8);
          livello = `**${row.level}** ${'\\⬛'.repeat(filledSquares)}${'\\⬜'.repeat(8-filledSquares)} ${row.level+1}\n`;
          livello += (nextLevelXp < 1000) ? `*${row.levelxp} / ${nextLevelXp} XP*` :
            `*${(row.levelxp/1000).toFixed(2)}k / ${(nextLevelXp/1000).toFixed(2)}k XP*`;
        }
        else livello = '---';

        return db.allAsync("SELECT nomeCompleto, nickname FROM Registrazioni R, Giochi G " +		// QUERY GIOCHI
          "WHERE R.game = G.nome AND userId = ? ORDER BY nomeCompleto ASC", [userId]); 
      })	
      .then( (rows) => 
      {
        if (rows && rows.length > 0)
        {
          giochi = nicknames = "";
          for (var i = 0; i < rows.length; i++) {
            giochi += rows[i].nomeCompleto + " \n";
            nicknames += "`" + rows[i].nickname + "`\n";
          };
        }
        
        // Formattazione del messaggio all'interno di un MessageEmbed
        const embed = new MessageEmbed()
          .setAuthor(username, statusIcon)
          .setThumbnail(targetMember.user.avatarURL())
          .setTimestamp()
          .setColor(targetMember.roles.hoist ? targetMember.roles.hoist.hexColor : "0xffffff")	// Colore del privilege-role dell'utente
          .addField("Livello", livello, true)			
          .addField("Reputazione", ` 🔸 **${reputazione} punt${reputazione == 1 ? "o" : "i"}**`, true)
          .addField("\u200b", "\u200b")
          .addField("Giochi:", giochi, true)
          .addField("Nickname registrato:", nicknames, true)
          .setFooter(`Attualmente registrato a ${rows.length} list${rows.length == 1 ? "a" : "e"}`)
          .addField("\u200b", "\u200b");

        message.channel.send({ embeds: [embed] });
      })
      .catch( (error) => 
      {
        message.reply("È stato riscontrato un errore durante l'elaborazione del profilo. 🤬");
        tools.logCommandError(this.client.logger, this, error);
      })
      .finally( () => db.close() );
  }
}

module.exports = Cmd_Profilo;
