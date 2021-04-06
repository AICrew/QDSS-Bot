const Command = require("../../base/Command.js");

const ROLE_ID_VETERANO = '420688274013814795';
const ROLE_ID_APPROVATO = '398543268754751489';


/****************************************************************************
*  Assegna ad un utente qualunque il ruolo di Approvato | Livello 3+		*
*	- Disponibile solo per gli utenti con il ruolo Veterani | Livello 20+	*
*																			*
****************************************************************************/

class Approva extends Command {
  constructor(client) {
    super(client, {
      name: "approva",
      description: "Assegna il ruolo Approvato ad un utente al di sotto del Livello 3. Disponibile solo ai Veterani.",
      category: "Miscellaneous",
      usage: "+approvato @utente",
      aliases: ["approve"],
	  guildOnly: true
    });
  }

  async run(message, args, level) 
  {
    const mentionedMember = message.mentions.members.first();
    
    if (mentionedMember === undefined)
    {
      message.channel.send("Non è stato menzionato nessun utente valido");
      return;
    }
    
    if (message.member.roles.cache.has(ROLE_ID_VETERANO)) 	// Se il chiamante ha i permessi necessari per eseguire l'azione...
    {
      if (mentionedMember.roles.cache.has(ROLE_ID_APPROVATO))  	// ... e il membro menzionato non è già approvato
      {
        message.channel.send("**" + mentionedMember.user.tag + "** è già approvato");
      }
      else
      { // Assegna all'utente menzionato il ruolo 'Approvato'
        mentionedMember.roles.add(ROLE_ID_APPROVATO)
          .then(message.channel.send("**" + mentionedMember.user.tag + "** è stato approvato"))
          .catch(console.error);
      }
    }
    else
    {
      message.reply("il comando è disponibile solo ai membri **Veterani | Livello 20+**");
    }

  }
}

module.exports = Approva;
