const { MessageActionRow, MessageButton } = require("discord.js");

const ROLE_ID_VETERANO = '420688274013814795';
const ROLE_ID_APPROVATO = '398543268754751489';

const LVL0_LEVELUP_MESSAGE = "Benvenuto sul server Discord di QDSS!\n\nNel server sono presenti ruoli dedicati ai giochi più diffusi nella community QDSS ed è presente " +
"un sistema di liste giocatori per facilitare la ricerca di compagni di gioco. Registrandoti alla lista di un gioco ti viene anche assegnato il relativo ruolo, " +
"e puoi usare il tag del gioco nella stanza `#ricerca-clan-e-compagni` per cercare altri ragazzi con cui giocare (anche se non sei registrato a nessuna lista) \:D" +
"\n\nAlcuni dei comandi utilizzabili in `#comandi-bot` *(senza mettere <>)*:\n**+help** o **+help** <***comando***>\n" +
"**+giochi** (nei comandi si usa il *nome abbreviato*)\n**+lista** <***gioco***>\n**+registra** <***gioco***> <***nickname***>\n**+profilo** (*mostra il tuo profilo*)\n" +
"\nSe vuoi suggerire migliorie per il bot o vuoi richiedere l'aggiunta di un gioco, puoi usare\n**+r_open** <*messaggio richiesta*>\n\n" +
"Puoi salire di livello nel server semplicemente partecipando a discussioni in chat, raggiungendo livelli più alti sbloccherai nuove possibilità " +
"(ad es. nessun limite all'invio di link nei messaggi, comandi speciali per il bot, ecc...); è presente anche un sistema di reputazione " +
"per cui puoi premiare un utente che ritieni meritevole tramite il comando **+rep @utente**.\n\nLe informazioni sugli altri bot del server si possono " +
"trovare nei messaggi fissati della stanza `#comandi-bot`\n\nBuona permanenza!\n*QDSS-Bot*";

const LVL3_LEVELUP_MESSAGE = "\n\nHai ricevuto il ruolo **Approvato | LVL 3+**, che ti fornisce i seguenti vantaggi:\n" +
" • nessun vincolo di utilizzare il Push-to-Talk nelle stanze vocali che prevedono questa limitazione (es. Salotto Sibaritico)\n" +
" • possibilità di inviare messaggi contenenti link nella chat del server, senza che vengano bloccati";

const LVL20_LEVELUP_MESSAGE = "\n\nHai ricevuto i ruoli **Veterano | LVL 20+** e **DJ**, che ti forniscono i seguenti vantaggi:\n" +
" • una chat esclusiva per veterani, con regolamento \"ammorbidito\" entro i limiti del buonsenso: `#livello_20-stanza_privata`\n" +
" • possibilità di assegnare manualmente il ruolo *Approvato | LVL 3+* ad altri utenti, tramite il comando `+approva @utente`\n" +
" • ***(DJ)*** maggiore controllo e permessi aumentati per i comandi del bot musicale *Rythm-Bot*";

module.exports = { 

  /** Print an error message detailing why a command has failed
    * @param logger : the Logger object that will be used to print the error log
    * @param command : the Command object that encountered the error
    * @param error : the error that has been thrown by the command
  */
  logCommandError : function (logger, command, error)
  {
    logger.error(`Command ${command.help.name} failed with ${error.stack}`);
  },

  /** Compare dates by checking if the timestamp represent the exact same day or not
    * @params dateA, dateB are the Date() objects to compare
    * @return true or false, depending if the dates coincide or not
  */
  isSameDay : function (dateA, dateB) 
  { 
    return dateA.getDate() === dateB.getDate() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getYear() === dateB.getYear();
  },


  /** Get the current system time, formatted for logs decoration purposes
    * @return string containing the current time formatted as "YYYY-MM-DD HH:mm:ss"
  */
  getTimestamp : function () 
  { 
    let timestamp = new Date();

    // UTC time doesn't take into account daylight savings time nor timezones, we alter
    // the UTCHours value by adding the offset required to bring the value in our timezone
    timestamp.setUTCHours(timestamp.getUTCHours() - timestamp.getTimezoneOffset() / 60);

    // ISO-8601 format is specified as "YYYY-MM-DDTHH:mm:ss.sssZ"
    return timestamp.toISOString().replace("T", " ").slice(0, -5);
  },


  /** Format the bot uptime value (provided in milliseconds) for printing
    * @return string containing the bot uptime formatted as "DD days, HH hrs, MM mins, SS secs"
  */
  formatUptime : function (uptime) 
  { 
    // Compute the number of days, hours, minutes and seconds of uptime
    let days = Math.floor(uptime / (1000*60*60*24));
    let hours = Math.floor(uptime / (1000*60*60)) % 24;
    let minutes = Math.floor(uptime / (1000*60)) % 60;
    let seconds = Math.floor(uptime / 1000) % 60;

    // Build the result string
    let result = `${days > 0 ? `${days} ${days == 1 ? 'day' : 'days'}, ` : ""}${hours > 0 || days > 0 ?
      `${hours} ${hours == 1 ? 'hr' : 'hrs'}, ` : ""}${minutes > 0 || hours > 0 || days > 0 ?
      `${minutes} ${minutes == 1 ? 'min' : 'mins'}, ` : ""}${seconds} ${seconds == 1 ? 'sec' : 'secs'}`;

    return result;
  },
  
  
  /** Shuffles the elements of an array
    * @param array : the array that has to be shuffled
    * @return the shuffled array
  */
  shuffleArray : function (array)
  {
    let currentIndex = array.length, randomIndex = 0,
      temporaryValue = 0;
    
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * (--currentIndex));
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

    return array;
  },
  
  
  /** Cleans a string by stripping away HTML tags and replacing
    * the HTML UTF-8 charset with proper Unicode characters
    * @param string : the text that has to be cleaned
    * @return a string containing the new text obtained after processing
  */
  cleanHTMLstring : function(string)
  {
    return string.replace(/<(?:.|\n)*?>/gm, "")
      .replace(/&#(\d+);/gi, (match, value) => String.fromCharCode(parseInt(value, 10)))
      .replace("&hellip;", "...");
  },


  /** Transforms a text into an equivalent string which can be used
    * as a name for TextChannel objects inside a Guild
    * @param string : the text that has to be made compliant to TextChannel name rules
    * @return a string containing the text obtained after processing
  */
  sanitizeTextChannelName : function(string)
  {
    // TEXT CHANNELS MUST BE ALPHANUMERICAL WITH DASHES OR UNDERSCORES
    return string.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_\-]/g, '');
  },
  

  /** Sends a message that is made up of multiple pages (either text or embeds) and
    * adds reactions that can be used as buttons to navigate between the different pages
    * @param channel : the channel in which the multi-page embeds have to be sent
    * @param pages : an array containing the 'pages' (strings or embeds)
    * @param author : the user allowed to click reactions to navigate pages 
  */
  sendMultiPageMessage : function (channel, pages, author)
  {
    if (!pages || pages.length == 0)
      return;

    if (pages.length == 1) 
    {
      channel.send({ embeds: [pages[0]] });
      return;
    }
    
    // Creare i due componenti interagibili (buttons) per lo step successivo
    const buttons = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('prev')
          .setLabel('<< Precedente')
          .setStyle('SECONDARY')
          .setDisabled(true),
        new MessageButton()
          .setCustomId('next')
          .setLabel('Successiva >>')
          .setStyle('SECONDARY')
          .setDisabled(false)
      );
    
    channel.send({ embeds: [pages[0]], components: [buttons] })
      .then( (message) => 
      {
        let i = 0, new_i = 0;
      
        const buttonCollector = message.createMessageComponentCollector({
          componentType: 'BUTTON',
          filter: (interaction) => interaction.user.id === author.id,
          time: 60000
        });
        
        buttonCollector.on('collect', (action) =>
        {
          if (action.customId === "prev")		// Pagina precedente
          {
            new_i = (i <= 0) ? 0 : i-1;
          }
          else if (action.customId === "next")		// Pagina successiva
          {
            new_i = (i >= pages.length-1) ? pages.length-1 : i+1;
          }
          
          if (new_i != i)
          {
            buttons.components[0].setDisabled(new_i == 0);
            buttons.components[1].setDisabled(new_i == pages.length-1);
            action.update({ embeds: [pages[new_i]], components: [buttons] });
            i = new_i;
          }
        });
        
        // Rimuovi i pulsanti quando il tempo disponibile per l'interazione è scaduto
        buttonCollector.on('end', () => message.edit({ embeds: [pages[i]], components: [] }));
      });
  },
  
  
  /** Implements the MEE6 formula for calculating the amount
    * of XP needed to go from a level to the next one
    * @param lvl : the current level of the user
    *	@return the amount of XP needed to level up
  */
  levelUpXP : function (lvl)
  {
    // MEE6 formula of XP needed to get from lvl to lvl+1
    return (5 * Math.pow(lvl, 2)) + (50 * lvl) + 100 ;
  },


  /** Calculates the total amount of XP obtained by a user
    * @param lvl : the current level of the user
    * @param curxp : the amount of xp earned by the user in the current level
    *	@return the total amount of xp collected by the user
  */
  totalUserXP : function (lvl, curxp)
  {
    let totalxp = 0;
    for (let i = 0; i < lvl; i++)
      totalxp += this.levelUpXP(i);
    totalxp += curxp;
    return totalxp;
  },
  
  
  /** Executes the routing for assigning XP points to a user, by also triggering the
    * leveling up events and sending the appropriate private messages to notify them
    * @param member : the GuildMember object of the user that needs to receive the XP
    * @param database : a handle to an QDSS-SQLite3 helper object, that will open the database
  */
  assignXP : async function (member, database)
  {
    const xp = 15 + Math.floor(Math.random() * 11);		// Valore casuale di XP tra 15 e 25
    
    const db = database.open();
    db.insertUserIfNotExists(member.id, member.user.tag)	// Per assicurarsi che l'utente sia nel database
      .then( () => db.getAsync ("SELECT * FROM Esperienza WHERE userId = ?", [member.id]))
      .then( async (row) => 
      {
        if (row)
        {
          // Calcoli per i nuovi valori di XP e livello
          const nextlevelxp = this.levelUpXP(row.level);
          let newTotalXp = row.totalxp + xp;
          let newLevelXp = row.levelxp + xp;
          let newLevel = row.level;
          
          if (newLevelXp >= nextlevelxp)
          {
            newLevel++;							// L'utente è salito di livello
            newLevelXp -= nextlevelxp;
            
            // Messaggio (DM) di notifica del level up e role rewards
            let levelUpMessage = `GG ${member.user}, sei avanzato al **Livello ${newLevel}** !`;
            
            if (newLevel == 3)		// Assegnazione del ruolo Approvato | LVL 3+ (e messaggio)
            {
              await member.roles.add(ROLE_ID_APPROVATO)
                .then(() => console.log("L'utente **" + member.user.tag + "** ha ricevuto il ruolo Approvato | LVL 3+"),
                  (error) => { throw error; });
                
              levelUpMessage += LVL3_LEVELUP_MESSAGE;
            }
            else if (newLevel == 20)	// Assegnazione dei ruoli DJ e Veterano | LVL 20+ (e messaggio)
            {
              await member.roles.add(ROLE_ID_VETERANO)
                .then(() => console.log("L'utente **" + member.user.tag + "** ha ricevuto il ruolo Veterano | LVL 20+"),
                  (error) => { throw error; });
                
              levelUpMessage += LVL20_LEVELUP_MESSAGE;
            }
    
            // Invio della notifica in messaggio privato
            member.send(levelUpMessage)
              .catch((error) => console.error(`DM (${member.id}) Error: ${error.message}`));
          }
          
          // Aggiornamento del database dell'XP
          db.run("UPDATE Esperienza SET totalxp = ?, levelxp = ?, level = ? WHERE userId = ?",
            [newTotalXp, newLevelXp, newLevel, member.id]);
        }
        else
        {
          // Inserire l'utente nel database dell'XP
          db.run("INSERT INTO Esperienza (userId, totalxp, levelxp, level) VALUES (?, ?, ?, ?)",
            [member.id, xp, xp, 0]);
    
          // Invio della notifica in messaggio privato
          member.send(LVL0_LEVELUP_MESSAGE)
            .catch((error) => console.error(`DM (${member.id}) Error: ${error.message}`));
        }
      })
      .catch(console.error)
      .finally( () => db.close() );

      return member;
  }
}
