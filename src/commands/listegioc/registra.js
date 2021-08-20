const Command = require("../../base/Command.js");
const tools   = require("../../base/tools.js");

const MAX_NICKNAME_LENGTH = 32;


/****************************************************************************************************
*  Con il comando REGISTRA, un utente si iscrive alla lista di uno dei giochi supportati dal bot    *
*   - l'inserimento del nickname come ultimo argomento è opzionale, (può essere inserito e anche    *
*     modificato successivamente tramite l'uso del comando NICKNAME)                                *
*                                                                                                   *
****************************************************************************************************/

class Cmd_Registra extends Command {
  constructor(client) {
    super(client, {
      name: "registra",
      description: "Iscriviti alla lista dei giocatori per un titolo per poter essere contattato da altri utenti interessati.",
      category: "Liste Giocatori",
      usage: "+registra <nome-gioco> <nickname-in-gioco>",
      aliases: ["register"],
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
    const nickname = args.join(" ");
    const userId = message.author.id;
    const author = message.author.tag;

    const db = this.client.database.open();
    db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game])
      .then( async (row) => 
      {
        if (row)
        {
          const gameName = row.nomeCompleto;
          const role = await message.guild.roles.fetch(row.ruolo);

          const registered = await db.getAsync("SELECT * FROM Registrazioni WHERE game = ? AND userId = ?", [game, userId])

          if (!registered)
          {
            await db.insertUserIfNotExists(userId, author);
            
            if (!nickname || /^\s*$/.test(nickname))		// Nickname non specificato
            {
              // Registrazione senza nickname
              await db.runAsync("INSERT INTO Registrazioni (userId, game) VALUES (?,?)", [userId, game]);
              message.reply(`Sei stato aggiunto alla lista per **${gameName}**.\n` +
                `Usa il comando \`+nickname <gioco> <nickname>\` per specificare il tuo nickname di gioco nella lista.`);
            }
            else
            {
              if (/(https?|ftp):\/\//i.test(nickname))    // Controlla che il nickname non contenga URL
              {
                message.reply("Il nickname fornito non può contenere URL o collegamenti web.");
                return;
              }
              
              if (nickname.length > MAX_NICKNAME_LENGTH)		// Controllo lunghezza del campo nickname
              {
                message.reply(`Il nickname fornito eccede la lunghezza massima supportata di ${MAX_NICKNAME_LENGTH} caratteri.`);
                return;
              }
              
              // Registrazione con nickname
              await db.runAsync("INSERT INTO Registrazioni (userId,game,nickname) VALUES (?,?,?)", [userId, game, nickname]);
              message.reply(`Sei stato aggiunto alla lista per **${gameName}** con il nickname *${nickname}*.`);
            }

            if (role) message.member.roles.add(role);    // Assegna all'utente il ruolo del gioco a cui si è appena registrato
          }
          else
          {
            // L'utente è già registrato alla lista del gioco
            message.reply(`Sei già registrato alla lista di ${gameName} (nickname: *${registered.nickname}*).`);
          }
        }
        else 
        {
          message.reply(`Il gioco \`${game}\` non esiste o non ha ancora una lista.`);
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

module.exports = Cmd_Registra;
