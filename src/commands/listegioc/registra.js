const Command = require("../../base/Command.js");
const QDSS_DB = require("../../util/qdss-sqlite.js");

const MAX_NICKNAME_LENGTH = 32;


/****************************************************************************************************
*  Con il comando REGISTRA, un utente si iscrive alla lista di uno dei giochi supportati dal bot	*
*   - l'inserimento del nickname come ultimo argomento è opzionale, (può essere inserito 			*
*     e anche modificato successivamente tramite l'uso del comando NICKNAME)						*
*																									*
****************************************************************************************************/

class Registra extends Command {
  constructor(client) {
    super(client, {
      name: "registra",
      description: "Iscriviti alla lista dei giocatori per un titolo, specificando opzionalmente il nickname, per poter essere contattato da altri utenti interessati",
      category: "Liste Giocatori",
      usage: "+registra <nome-gioco> <nickname-in-gioco>",
      aliases: ["register"],
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
	
    const game = args.shift().toLowerCase();
		const nickname = args.join(" ");
		const userId = message.author.id;
		const author = message.author.tag;

		const db = QDSS_DB.Open();
		db.getAsync("SELECT * FROM Giochi WHERE nome = ?", [game]).then( async (row) => 
		{
			if (row)
			{
				const gameName = row.nomeCompleto;
				const role = message.guild.roles.find(role => role.name === gameName);

				const registered = await db.getAsync("SELECT * FROM Registrazioni WHERE game = ? AND userId = ?", [game, userId])

				if (!registered)
				{
					await db.insertUserIfNotExists(userId, author);
					
					if (!nickname || /^\s*$/.test(nickname))		// Nickname non specificato
					{
						// Registrazione senza nickname
						await db.runAsync("INSERT INTO Registrazioni (userId, game) VALUES (?,?)", [userId, game]);
						message.reply("sei stato aggiunto alla lista per " + gameName +
						"\nUsa il comando +nickname <gioco> <nickname> per specificare il tuo nickname di gioco nella lista");
					}
					else
					{
						if (/(https?|ftp):\/\//i.test(nickname))    // Controlla che il nickname non contenga URL
						{
							message.reply("il nickname non può contenere degli URL");
							return;
						}
						
						if (nickname.length > MAX_NICKNAME_LENGTH)		// Controllo lunghezza del campo nickname
						{
							message.reply("hai a disposizione un massimo di " + MAX_NICKNAME_LENGTH + " caratteri per nickname e informazioni aggiuntive.");
							return;
						}
						
						// Registrazione con nickname
						await db.runAsync("INSERT INTO Registrazioni (userId,game,nickname) VALUES (?,?,?)", [userId, game, nickname]);
						message.reply("sei stato aggiunto alla lista per " + gameName + " con il nickname: " + nickname);
					}

					if (role)
						return message.member.addRole(role);    // Assegna all'utente il ruolo del gioco a cui si è appena registrato
				}
				else
				{
					// L'utente è già registrato alla lista del gioco
					return message.reply("sei già nella lista per " + gameName + " (" + registered.nickname + ")");
				}
			}
			else 
				return message.reply("il gioco `" + game + "` non esiste o non ha ancora una lista.");
		})
		.then( () => db.close() )
		.catch( (err) => {
			db.close();
			throw err;
		});

  }
}

module.exports = Registra;
