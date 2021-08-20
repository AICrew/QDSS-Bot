const Command = require("../base/Command.js");
const tools   = require("../base/tools.js");
const { MessageActionRow, MessageButton } = require('discord.js');

const BOT_CHANGELOG_CHANNEL_ID = '510090452096253953';

const CHANGELOG_CREATION_MESSAGE = "Per completare la creazione del changelog, selezionare le opzioni da attivare premendo sulla relativa *reaction* di questo messaggio:\n" +
" - 📢 per usare la menzione globale (@ everyone) nel messaggio\n - 📌 per salvare il changelog tra i messaggi fissati del canale destinazione\n\n" +
"Una volta selezionate le opzioni desiderate, è possibile confermare la pubblicazione del post oppure annullare l'operazione..."


/************************************************************************************
*  Tramite il comando CHANGELOG, il bot invia in un canale dedicato un messaggio    *
*  il cui contenuto viene definito dagli admin, con lo scopo di mantenere gli       *
*  utenti del server aggiornati con gli ultimi sviluppi del QDSS-Bot                *
*                                                                                   *
************************************************************************************/

class Cmd_Changelog extends Command {
  constructor(client) {
    super(client, {
      name: 'changelog',
      description: 'Pubblica un messaggio di changelog, contenente aggiornamenti e novità relative al bot.',
      usage: '+changelog "titolo"',
      aliases: [],
      permLevel: 'Bot Admin',
      guildOnly: true
    });
  }

  async run(message, args) 
	{
    let titolo = args.join(" ");
    const channel = message.guild.channels.cache.get(BOT_CHANGELOG_CHANNEL_ID);

    if (!(/^\".*\"$/.test(titolo)))
    {
      message.reply('Il comando deve essere utilizzato con il formato `+changelog "titolo"`' + 
        '\nProcedura di creazione del changelog annullata.');
      return;
    }

    titolo = titolo.substring(1, titolo.length - 1);
		
		if (!channel)
		{
			message.reply("Il canale di destinazione (ID: " + BOT_CHANGELOG_CHANNEL_ID + ") " +
				"non è raggiungibile\nProcedura di creazione del changelog annullata.");
			return;
		}
        
    message.reply(`Il titolo del changelog sarà: **${titolo}**\nSpecificare ora il contenuto del post tra *< >*`)
      .then((msg1) => 
      {
        const msgCollector = msg1.channel.createMessageCollector ({
          filter: msg => msg.author.id === message.author.id && /^<(.*\n*)*>$/.test(msg.content)
        });
        msgCollector.on('collect', (response) => 
        {
          const contenuto = response.content.substring(1, response.content.length - 1);

          // Creare i due componenti interagibili (buttons) per lo step successivo
          const buttons = new MessageActionRow()
			      .addComponents(
				      new MessageButton()
                .setCustomId('confirm')
                .setLabel('Conferma')
                .setStyle('SUCCESS'),
              new MessageButton()
                .setCustomId('cancel')
                .setLabel('Annulla')
                .setStyle('DANGER')
			      );
          
          response.reply({ 
            content: CHANGELOG_CREATION_MESSAGE,
            components: [buttons] })
            .then(async (msg2) => 
            {
              await msg2.react('📢');		 // :loudspeaker: 
              await msg2.react('📌');		 // :pushpin:

              const buttonCollector = msg2.createMessageComponentCollector({
                componentType: 'BUTTON',
                filter: (interaction) => interaction.user.id === message.author.id
              });
              buttonCollector.on('collect', async (action) =>
              {
                if (action.customId === 'confirm')
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
                  channel.send(changelog)
                    .then(async (announcement) => 
                    {
                        await announcement.react('👍');     // :thumbsup:
                        await announcement.react('👎');     // :thumbsdown:

                        if (pin) announcement.pin(); 
                    })
                    // Rimuovi i buttons dal messaggio quando il changelog è stato inviato
                    .then( () => action.update({ content: CHANGELOG_CREATION_MESSAGE, components: [] }));

                  buttonCollector.stop();
                }
                else if (action.customId === 'cancel')
                {
                  // Cancella messaggi precedenti e arresta la procedura di creazione
                  message.delete()
                    .then(() => msg1.delete())
                    .then(() => response.delete())
                    .then(() => msg2.delete())
                    .then(() => message.channel.send(`Creazione del changelog annullata da **${message.author.tag}**`));

                  buttonCollector.stop();
                  return;
                }
              });
            });
              
          msgCollector.stop();
        });
      });
  }
}

module.exports = Cmd_Changelog;
