const Command = require("../../base/Command.js");
const tools   = require("../../base/tools.js");

const ACTION_UNKNOWN = 0;
const ACTION_ADD_GAME_DB = 1;
const ACTION_REMOVE_GAME_DB = 2;
const ACTION_EDIT_COLOR_GAME_DB = 3;


/************************************************************************************************
*  Il comando GAMEDB, disponibile solo agli utenti con i permessi Bot Support, permette di      *
*  aggiungere, rimuovere o modificare le info relative ai giochi supportati dal QDSS-Bot,       *
*  evitando di dover intervenire  manualmente sul database. Il comando si occupa di             *
*  manipolare le entry opportune nella tabella GIOCHI ed il ruolo associato al gioco.           *
*   - la distinzione tra le varie possibili operazioni è specificata dal primo parametro        *
*     del comando, che può assumere i valori "add", "remove" oppure "color" in base al tipo     *
*     di azione che si vuole eseguire                                                           *
*                                                                                               *
************************************************************************************************/

class Cmd_GameDB extends Command {
  constructor(client) {
    super(client, {
      name: "gamedb",
      description: "Aggiunta, rimozione o modifica di un gioco (e relativo ruolo) tra quelli supportati dal QDSS-Bot.",
      category: "Liste Giocatori",
      usage: "+gamedb add \"<nome-gioco>\" <nome-abbreviato> 0xCOLORE [link-logo]\n" +
        "\t\t+gamedb remove <nome-abbreviato>\n" + 
        "\t\t+gamedb color <nome-abbreviato> 0xCOLORE",
      aliases: ["dbgiochi"],
      permLevel: "Bot Support",
	    guildOnly: true
    });
  }

  async run(message, args) 
  {
    // Parsing dei parametri del comando
    let action = ACTION_UNKNOWN;
    let actionCmd = args.shift()
    if (actionCmd)
      actionCmd = actionCmd.toLowerCase();
  
    switch (actionCmd)
    {
      case "add":
        action = ACTION_ADD_GAME_DB;
      break;
      
      case "aggiungi":
        action = ACTION_ADD_GAME_DB;
      break;
      
      case "remove":
        action = ACTION_REMOVE_GAME_DB;
      break;
      
      case "rimuovi":
        action = ACTION_REMOVE_GAME_DB;
      break;
      
      case "color":
        action = ACTION_EDIT_COLOR_GAME_DB;
      break;
      
      case "colore":
        action = ACTION_EDIT_COLOR_GAME_DB;
      break;
      
      default:
        action = ACTION_UNKNOWN;
        message.reply(`Il parametro \`${actionCmd}\` non è un'azione valida per questo comando.`);
      return;
    }
  
  
    try
    {
      if (action == ACTION_ADD_GAME_DB)
      {
        // ==============================================
        // =                                            =
        // =      Aggiunta di un nuovo gioco al DB      =
        // =                                            =
        // ==============================================
        
        let parsingError = true;
        let commandLine = args.join(" ");
        let firstIndex = commandLine.search("\"");
        let game, gameName, gameColor, gameLogo, gameRole;
        let query_insert = "";
        
        if (firstIndex != -1)
        {
          firstIndex++;
          const secondIndex = commandLine.slice(firstIndex).lastIndexOf("\"");
          if (secondIndex != -1)
          {
            gameName = commandLine.slice(firstIndex, firstIndex + secondIndex);
            commandLine = commandLine.slice(secondIndex + 2);
          
            const params = commandLine.split(" ");
            while (params[0] == "") params.shift();
          
            if (params.length == 2 || params.length == 3)
            {
              game = params[0];
              gameColor = params[1];
              
              // Controllo sui principali errori negli argomenti di input
              parsingError = (game === undefined || gameColor === undefined ||
                game.search("\"") != -1 || gameColor.search("0x") == -1)    
            
              if (!parsingError && params.length == 3)
              {
                gameLogo = params[2];
                parsingError = !(/(https?):\/\/.*\.(png|jpg|jpeg)/i.test(gameLogo));
              }
            }
          }
        }

        if (parsingError)
        {
          message.reply("Errore nel parsing degli argomenti di input, utilizzare il formato corretto:\n" + 
            "`+gamedb add \"<nome-gioco-completo>\" <nome-gioco-abbreviato> <0xCOLORE> [link-immagine-gioco]`");
          return;
        }

        // Creazione del ruolo associato al gioco in questione
        let role = message.guild.roles.cache.find(role => role.name === gameName);
        if (!role)
        {
          await message.guild.roles.create({
              data: {
                name: gameName,
                color: gameColor,
              },
              reason: `Ruolo creato per il gioco ${gameName}.`
            })
            .then( (role) => {
              role.setMentionable(true);
              gameRole = role.id;
              message.channel.send(`Il ruolo [${gameName}] è stato creato correttamente. :white_check_mark: `); 
            }, (error) => {
              message.channel.send(`Errore nella creazione del ruolo [${gameName}]. :x: `); 
              throw error;
            });
        }
        else message.channel.send(`Il ruolo [${gameName}] era già presente nel server e perciò non è stato creato.`);
        
        // Questo garantisce che il ruolo sia inserito nella cache non appena creato
        role = await message.guild.roles.fetch(gameRole, true);
        
        query_insert = (gameLogo === undefined) ?
          `INSERT INTO Giochi (nome,nomeCompleto,colore,ruolo) VALUES ('${game}', '${gameName}', '${gameColor}', '${gameRole}')` :
          `INSERT INTO Giochi (nome,nomeCompleto,colore,logo,ruolo) VALUES ('${game}', '${gameName}', '${gameColor}', '${gameLogo}', '${gameRole}')`;
        
        const db = this.client.database.open();
        await db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game])
          .then( async (gameExists) => 
          {
            if (!gameExists)
            {
              // Aggiunta della entry con le informazioni del gioco nella tabella GIOCHI
              await db.runAsync(query_insert)
                .then( () => {
                  message.channel.send(`L'inserimento di **${gameName}**` +
                    ` tra i giochi del database è avvenuto con successo. :white_check_mark:`);
                }, (error) => {
                  message.channel.send(`Errore nell'inserimento di **${gameName}** nel database. :x:`)
                  throw error;
                });
            }
            else message.channel.send(`Il gioco **${gameName}** è già presente nel database.`);
          })
          .finally( () => db.close() );
      }
      else if (action == ACTION_REMOVE_GAME_DB)
      {
        // ==========================================
        // =                                        =
        // =      Rimozione di un gioco dal DB      =
        // =                                        =
        // ==========================================
        
        if (args.length == 0)
        {
          message.reply("Il formato corretto del comando è `+gamedb remove <nome-gioco>`.");
          return;
        }
        
        const game = args.join(" ").toLowerCase();

        const db = this.client.database.open();
        db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game])
          .then( async (row) => 
          {
            if (!row)
            {
              message.channel.send("Il gioco `" + game + "` non esiste nel database. :x:");
              return;
            }

            // Eliminazione delle registrazioni al gioco in questione
            await db.runAsync("DELETE FROM Registrazioni WHERE game = ?", [game])
              .then( () => {
                message.channel.send(`Le registrazioni a **${row.nomeCompleto}**" sono state eliminate con successo. :white_check_mark:`);
              }, (error) => {
                message.channel.send(`Errore durante la cancellazione delle registrazioni a **${row.nomeCompleto}**. :x:`);
                this.client.logger.error(error);
                throw error;
              });
            
            // Eliminazione della entry con le informazioni del gioco nella tabella GIOCHI
            await db.runAsync("DELETE FROM Giochi WHERE nome = ?", [game])
              .then( () => {
                message.channel.send(`**${row.nomeCompleto}** è stato eliminato con successo dalla lista dei giochi. :white_check_mark:`);
              }, (error) => {
                message.channel.send(`Errore durante la cancellazione di **${row.nomeCompleto}** dalla lista dei giochi. :x:`);
                throw error;
              });

            // Cancellazione del ruolo associato al gioco in questione
            const role = await message.guild.roles.fetch(row.ruolo);
            if (role)
            {
              await role.delete(`Eliminazione del gioco ${row.nomeCompleto} dal sistema.`)
                .then( (role) => {
                  message.channel.send(`Il ruolo [${row.nomeCompleto}] è stato eliminato con successo dal server. :white_check_mark:`);
                }, (error) => {
                  message.channel.send(`Errore durante l'elminazione del ruolo [${row.nomeCompleto}] dal server. :x:`);
                  throw error;
                });
            }
            else message.channel.send(`Il ruolo [${row.nomeCompleto}] non esisteva, perciò non è stato eliminato.`);

            // Eliminazione dell'eventuale stanza dedicata al gioco
            const GAME_CATEGORY_CHANNEL_ID = '592752263861108746';
            const channelName = tools.sanitizeTextChannelName(row.nomeCompleto);
            const channel = message.guild.channels.cache.find(chan => chan.name === channelName && chan.parentID === GAME_CATEGORY_CHANNEL_ID);
            if (channel)
            {
              await channel.delete()
                .then( (channel) => {
                  message.channel.send(`La stanza [${chan.name}] è stata eliminata con successo dal server. :white_check_mark:`);
                }, (error) => {
                  message.channel.send(`Errore durante l'elminazione della stanza [${chan.name}] dal server. :x:`);
                  throw error;
                });
            }
            else message.channel.send(`La stanza [${channelName}] non esisteva, perciò non è stata eliminata.`);
          })
          .finally( () => db.close() );
      }
      else if (action == ACTION_EDIT_COLOR_GAME_DB)
      {
        // ==========================================================
        // =                                                        =
        // =    Modifica del colore associato ad un gioco nel DB    =
        // =                                                        =
        // ==========================================================
        
        const game = args.shift();
        const color = args.join(" ");
          
        if (!game || !color)
        {
          message.reply("Il formato del comando è errato, usare `+gamedb color <nome-gioco> 0xCOLORE`.");
          return;
        }
          
        if (!/^0x/.test(color))
        {
          message.reply(`\`${color}\` non è un colore valido, usare il formato \`0xHHHHHH\`.`);
          return;
        }
            
        const db = this.client.database.open();
        db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game])
          .then( async (row) => 
          {
            if (!row)
            {
              message.reply(`Il gioco \`${game}\` non esiste nel database. :x:`);
              return;
            }

            // Query di aggiornamento del campo 'colore' nel database dei giochi
            await db.runAsync("UPDATE Giochi SET colore = ? WHERE nome = ?", [color, game]);
            message.channel.send("Aggiornamento del colore nel database completato con successo. :white_check_mark:");
              
            const role = await message.guild.roles.fetch(row.ruolo);
            if (role)
            {                            // Modifica del colore associato al ruolo del gioco
              await role.setColor(color)
                .then( (role) => {
                  message.channel.send(`Il ruolo [${row.nomeCompleto}] è stato aggiornato con il colore ${color}. :white_check_mark:`);
                }, (error) => {
                  message.channel.send(`Errore durante l'aggiornamento del colore per il ruolo [${row.nomeCompleto}]. :x:`);
                  throw error;
                });
            }
            else message.channel.send(`Impossibile aggiornare il colore del ruolo [${row.nomeCompleto}], perchè non esiste. :x:`);
          })
          .finally( () => db.close() );
      }
    }
    catch (error)
    {
      tools.logCommandError(this.client.logger, this, error);
    }
  }
}

module.exports = Cmd_GameDB;
