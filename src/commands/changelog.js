const Command = require("../base/Command.js");

const BOT_CHANGELOG_CHANNEL_ID = '510090452096253953';


/************************************************************************************
*  Tramite il comando CHANGELOG, il bot invia in un canale dedicato un messaggio 	*
*  il cui contenuto viene definito dagli admin, con lo scopo di mantenere gli		*
*  utenti del server aggiornati con gli ultimi sviluppi del QDSS-Bot				*
*																					*
************************************************************************************/

class Changelog extends Command {
    constructor(client) {
        super(client, {
            name: 'changelog',
            description: 'Pubblica un messaggio di changelog, contenente aggiornamenti e novità relative al bot',
            usage: '+changelog "titolo"',
            aliases: [],
            permLevel: 'Bot Admin',
			guildOnly: true
        });
    }

    async run(message, args, level) 
	{
        let titolo = args.join(" ");
        const channel = message.guild.channels.cache.find(c => c.id === BOT_CHANGELOG_CHANNEL_ID);

        if (!(/^\".*\"$/.test(titolo)))
        {
            message.reply('utilizzare il comando con il formato `+changelog "titolo"`\nProcedura di creazione del changelog annullata.');
            return;
        }

        titolo = titolo.substring(1, titolo.length - 1);
		
		if (!channel)
		{
			message.channel.send("Il canale di destinazione (ID: " + BOT_CHANGELOG_CHANNEL_ID + ") " +
				"non è raggiungibile\nProcedura di creazione del changelog annullata.");
			return;
		}
        
        message.reply("il titolo del changelog sarà: **" + titolo + "**\nSpecificare ora il contenuto del post tra *< >*")
        .then((msg1) => {
            
            const msgCollector = msg1.channel.createMessageCollector (
                msg => msg.author.id === message.author.id && /^<(.*\n*)*>$/.test(msg.content) );     // filtro per il MessageCollector
            msgCollector.on('collect', (response) => {
                
                const contenuto = response.content.substring(1, response.content.length - 1);
            
                message.reply("per completare la creazione del changelog, selezionare le opzioni da attivare premendo sulla relativa *reaction* di questo messaggio:\n" +
					" - \uD83D\uDCE2 per usare la menzione globale (@ everyone) nel messaggio\n - \uD83D\uDCCC per salvare il changelog tra i messaggi fissati del canale destinazione\n\n" +
					"Una volta selezionate le opzioni desiderate, premere su \u2705 per pubblicare il post oppure su \uD83D\uDEAB per annullare l'operazione...")
                .then(async (msg2) => {
                    
                    await msg2.react('📢');		 // :loudspeaker: 
                    await msg2.react('📌');		 // :pushpin: 
                    await msg2.react('🚫');		 // :no_entry_sign: 
                    await msg2.react('✅');	    // :white_check_mark: 
                    
                    const reactCollector = msg2.createReactionCollector (				// filtro per il ReactionCollector
                        (reaction, user) => user.id === message.author.id &&
                        (reaction.emoji.name === "🚫" || reaction.emoji.name === "✅" ));
                    reactCollector.on ('collect', (reaction) => {
                        
                        if (reaction.emoji.name === "🚫" && reaction.count > 1)
                        {
                            // Cancella messaggi precedenti e arresta la procedura di creazione
							message.delete()
                            .then(() => msg1.delete())
							.then(() => response.delete())
							.then(() => msg2.delete())
							.then(() => message.channel.send(`Creazione del changelog annullata da **${message.author.tag}**`))
							.catch(console.error);
                            
                            reactCollector.stop();
                            return;
                        }
                        else if (reaction.emoji.name === "✅" && reaction.count > 1)
                        {
                            // Conteggio delle reactions per determinare le opzioni di creazione del post
                            let pin = false, everyone = false;
                            const pinReaction = msg2.reactions.cache.find(r => r.emoji.name === '📌');
                            const everyoneReaction = msg2.reactions.cache.find(r => r.emoji.name === '📢');
                            
                            if (pinReaction !== undefined)
                                pin = (pinReaction.users.cache.find(u => u.id === message.author.id) === message.author);
                            if (everyoneReaction !== undefined)
                                everyone = (everyoneReaction.users.cache.find(u => u.id === message.author.id) === message.author);

                            // Invio del messaggio nell'apposito canale testuale su Discord
							const changelog = `***${titolo}***\n\n${everyone ? "@everyone " : ""}${contenuto}`;
                            channel.send(changelog).then(async (announcement) => 
                            {
                                await announcement.react('👍');     // :thumbsup:
                                await announcement.react('👎');     // :thumbsdown:

                                if (pin) announcement.pin(); 
                            });
            
                            reactCollector.stop();
                        }
                    });

                });
                
                msgCollector.stop();
            });
        });

    }
}

module.exports = Changelog;
