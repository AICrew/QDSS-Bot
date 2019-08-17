const Command = require("../../base/Command.js");
const tools = require("../../base/tools.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");
const Discord = require("discord.js");


/************************************************************************************************
*  Il comando GIOCHI visualizza l'elenco dei giochi supportati dal bot per i quali				*
*  è disponibile il servizio di registrazione del proprio nickname tra i giocatori attivi,		*
*	- l'elenco di risposta è formattato tramite (uno o più) RichEmbed, organizzati in pagine	*
*																								*
************************************************************************************************/

class Giochi extends Command {
  constructor(client) {
    super(client, {
      name: "giochi",
      description: "Elenca tutti i giochi supportati dal bot",
      category: "Liste Giocatori",
      usage: "+giochi",
      aliases: ["games", "listagiochi", "gameslist"],
      guildOnly: true
    });
  }

  async run(message, args, level) 
  {
		const db = QDSS_DB.Open();
		
		db.allAsync("SELECT nome, nomeCompleto FROM Giochi ORDER BY nomeCompleto ASC").then( (rows) => 
		{
			if (!rows)
				return;

			const pages = new Array();
			const footer = "Totale giochi: " + rows.length;
			
			// Creazione delle pagine che costituiscono la lista (i = #gioco, n = #pagina)
			for (let n = 0, i = 0; i < rows.length; n++)
			{
				// Creazione della lista di stringhe da inviare nella risposta
				let l_games = "", l_shortenings = "";
				for (; i < rows.length; i++)
				{
				  if (l_games.length + rows[i].nomeCompleto.length < 1020 &&
							l_shortenings.length + rows[i].nome.length < 1020)		// Limite di max 1024 caratteri per field
				  {	
						l_games += rows[i].nomeCompleto + " \n";							
						l_shortenings += "`" + rows[i].nome + "`\n";
				  }
				  else break;
				}
				
				// Creazione dell'array di pagine (RichEmbed)
				const embed = new Discord.RichEmbed()
				  .setColor(0x11C8D5)
				  .addField("Giochi supportati:", l_games, true)
				  .addField("Abbreviazione comando:", l_shortenings, true);

				pages.push(embed);
			}
			
			// Assegnazione dei numeri di pagina a ciascun RichEmbed in pages[]
			for (let i = 0; i < pages.length; i++)
			{
			  if (pages.length == 1)
			  {
					pages[0].setFooter(footer);
					break;
			  }
			  
			  pages[i].setFooter(`${footer} (Pagina ${i+1}/${pages.length})`);
			}

			// Invio del messaggio di risposta
			tools.sendMultiPageMessage(message.channel, pages, message.author);
		})
		.then( () => db.close() )
		.catch( (err) => {
			db.close();
			throw err;
		});

  }
}

module.exports = Giochi;
