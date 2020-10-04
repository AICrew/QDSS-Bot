const Command = require("../../base/Command.js");
const tools = require("../../base/tools.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");
const Discord = require("discord.js");


/****************************************************************************************************
*  Il comando LISTA visualizza l'elenco dei giocatori registrati alla lista di un certo gioco		    *
*   - gli utenti sono ordinati in base allo status: Online, AFK, Occupati, Offline					        *
*	  - all'interno di ogni gruppo l'ordine degli utenti è randomizzato								                *
*	  - il messaggio di risposta è formattato tramite Discord MessageEmbed con immagine e colori			    *
*	  - nel caso di messaggio troppo lungo, viene suddiviso in pagine navigabili tramite reactions	  *
*																									                                                  *
****************************************************************************************************/

class Lista extends Command {
  constructor(client) {
    super(client, {
      name: "lista",
      description: "Mostra i giocatori iscritti alla lista del gioco selezionato",
      category: "Liste Giocatori",
      usage: "+lista <nome-gioco>",
      aliases: ["list"],
      guildOnly: true
    });
  }

  async run(message, args, level) 
  {
    if (args.length == 0)
    {
      message.reply("devi indicare il nome di un gioco come secondo parametro del comando.");
      return;
    }

    const game = args[0].toLowerCase();
    if (game === "giochi")
    {														                        // A causa del comune utilizzo di +lista giochi al posto di +giochi
      const cmd = this.client.commands.get("giochi");		// si prevede l'eventualità di richiamare il comando Giochi se opportuno
      cmd.run(message, args, level);
      return;
    }
	
    const db = QDSS_DB.Open();

    db.allAsync("SELECT * FROM Giochi G, Registrazioni R, Utenti U " +
        "WHERE G.nome = R.game AND U.userId = R.userId AND R.game = ?", [game])
    .then( async (rows) => 
    {
      if (rows !== undefined && rows.length > 0) 
      {
        const gameName = rows[0].nomeCompleto;
        const color = rows[0].colore;
        const logo = rows[0].logo;
        
        const users_online = new Array(),
          users_offline = new Array(),
          users_afk = new Array(),
          users_busy = new Array();
        
        for (let i = 0; i < rows.length; i++)
        {
          await this.client.users.fetch(rows[i].userId, true).then( (user) => 
          {
            if (!user) 
              return;
            
            // Si ottiene lo stato di presenza dell'utente e lo si inserisce nell'array corrispondente
            const status = user.presence.status;      
            if (status === "online")
              users_online.push(`<:dot_online:499667720430682114> ${user.tag} (${rows[i].nickname}) \n`);
            else if (status === "idle")
              users_afk.push(`<:dot_afk:499667640969723914> ${user.tag} (${rows[i].nickname}) \n`);
            else if (status === "dnd")
              users_busy.push(`<:dot_busy:499667667855212564> ${user.tag} (${rows[i].nickname}) \n`);
            else if (status === "offline")
              users_offline.push(`<:dot_offline:499667690986668075> ${user.tag} (${rows[i].nickname}) \n`);
          })
          .catch( (err) => console.log("User " + rows[i].userId + " doesn't exist anymore, " + err));
        }
        
        // Shuffling dell'ordine degli utenti negli array 
        const users = tools.shuffleArray(users_online)		// ONLINE USERS
          .concat(tools.shuffleArray(users_afk))				  // AFK USERS
          .concat(tools.shuffleArray(users_busy))				  // BUSY USERS
          .concat(tools.shuffleArray(users_offline));			// OFFLINE USERS
        
        const pages = new Array();
    
        // Stringa footer di fondopagina
        const footer = (users.length == 1) ?
        "1 giocatore registrato" : users.length + " giocatori registrati";
    

        // Creazione delle pagine della lista (i = #utente, n = #pagina)
        for (let n = 0, i = 0; i < users.length; n++)
        {
          // Creazione della lista di stringhe da inviare nella risposta
          let l_username = "";
          for (; i < users.length; i++)
          {
            if (l_username.length + users[i].length < 1020)		  // Lunghezza max di 1024 caratteri per field
              l_username += users[i];
            else break;
          }

          // Costruzione del messaggio di risposta, formattato tramite MessageEmbed
          const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setThumbnail(logo)
            .addField("Username (nickname in gioco)", l_username, true)
            .setTimestamp();
            //.setURL("https://qdss.glitch.me/" + game);

          if (n == 0)
            embed.setTitle(" === Lista giocatori di " + gameName + " ===");

          // Ciascuna pagina della lista è inserita in un array di pagine
          pages.push(embed);
        }
    
        // Assegnazione dei numeri di pagina a ciascun MessageEmbed in pages[]
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
      }
      else
      {
        // Il gioco non esiste oppure l'utente non è registrato ?
        const gameExists = await db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game]);
        if (gameExists) 
          message.reply("la lista di `" + game + "` non ha ancora nessun iscritto"); 
        else message.reply("il gioco `" + game + "` non esiste o non ha ancora una lista.");
      }
    })
    .then( () => db.close() )
    .catch( (err) => {
      db.close();
      throw err;
    });

  }
}

module.exports = Lista;
