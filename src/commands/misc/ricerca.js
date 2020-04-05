const Command = require("../../base/Command.js");
const tools = require("../../base/tools.js");
const Discord = require("discord.js");
const dotenv = require('dotenv').config({path: '../../.env'});

const QDSS_CHANNEL_COLOR = 0x3498DB;
const QDSS2_CHANNEL_COLOR = 0xFFBF00;
const QDSSTRASH_CHANNEL_COLOR = 0x6A0888;
const IROGNOSI_CHANNEL_COLOR = 0x0ABC37;
const QDSSMUSIC_CHANNEL_COLOR = 0x171615;
const TUTTOSBAGLIATO_CHANNEL_COLOR = 0xDD561F;
const ALTROCINEMA_CHANNEL_COLOR = 0xBD101D;
const QDSSIT_WEBSITE_COLOR = 0x11C8D5;


/*********************************************************************************
* Gestore d'interfaccia per la ricerca sui numerosi canali YouTube di QDSS		 *
* e sul sito web QDSS.it														 *
* - Utilizza le API youtube-search e wpapi (Wordpress) per ottenere i risultati  *
*		della ricerca in formato JSON											 *
*																				 *
*********************************************************************************/

class Ricerca extends Command {
  constructor(client) {
    super(client, {
      name: "ricerca",
      description: "Ricerca video sui canali youtube di Quei Due Sul Server o articoli su QDSS.it",
      category: "Miscellaneous",
      usage: "+ricerca <canale/sito> <termini-da-cercare>",
      aliases: ["search"]
    });
  }

  async run(message, args, level) 
  {
	let target = args.shift();
    const keywords = args.join(" ");
	let options;
	
	target = target ? target.toLowerCase() : "null";
	
    switch (target)
	{
		case "qdss":
		
			options = {
				maxResults: 3,
				key: process.env.YOUTUBE_API_KEY,
				channelId: "UC_eA572lBzVkpXhoeWnqSKQ",
				order: "date",
				q: keywords
			};
			
			youtubeSearch(keywords, options, QDSS_CHANNEL_COLOR, message.channel);
			
		break;
		
		case "qdss2":
		
			options = {
			  maxResults: 3,
			  key: process.env.YOUTUBE_API_KEY,
			  channelId: "UC5GSO2hiHevgZUhSQIJNd2A",
			  order: "date",
			  q: keywords
			};
			
			youtubeSearch(keywords, options, QDSS2_CHANNEL_COLOR, message.channel);
			
		break;
		
		case "qdsstrash":
		
			options = {
			  maxResults: 3,
			  key: process.env.YOUTUBE_API_KEY,
			  channelId: "UC7mru_iFtYCoDilRi3OvqmQ",
			  order: "date",
			  q: keywords
			};
			
			youtubeSearch(keywords, options, QDSSTRASH_CHANNEL_COLOR, message.channel);
			
		break;
		
		case "irognosi":
		
			options = {
			  maxResults: 3,
			  key: process.env.YOUTUBE_API_KEY,
			  channelId: "UCmVlQTe0PeiNNHD-wAeC8vQ",
			  order: "date",
			  q: keywords
			};
			
			youtubeSearch(keywords, options, IROGNOSI_CHANNEL_COLOR, message.channel);
			
		break;
		
		case "qdssmusic":
		
			options = {
			  maxResults: 3,
			  key: process.env.YOUTUBE_API_KEY,
			  channelId: "UC3J04ZxHo2aRYJPl1tyWKMA",
			  order: "date",
			  q: keywords
			};
			
			youtubeSearch(keywords, options, QDSSMUSIC_CHANNEL_COLOR, message.channel);
			
		break;
		
		case "tuttosbagliato":
		
			options = {
			  maxResults: 3,
			  key: process.env.YOUTUBE_API_KEY,
			  channelId: "UCDy4cREE4oBF7EhoW0wnS-g",
			  order: "date",
			  q: keywords
			};
			
			youtubeSearch(keywords, options, TUTTOSBAGLIATO_CHANNEL_COLOR, message.channel);
			
		break;
		
		case "altrocinema":
		
			options = {
			  maxResults: 3,
			  key: process.env.YOUTUBE_API_KEY,
			  channelId: "UCYFgn8_JgaQL1E-N2tg1xcQ",
			  order: "date",
			  q: keywords
			};
			
			youtubeSearch(keywords, options, ALTROCINEMA_CHANNEL_COLOR, message.channel);
			
		break;
		
		case "qdss.it":
		
			wordpressSearch(keywords, QDSSIT_WEBSITE_COLOR, message.channel);
			
		break;
		
		default:
			message.reply("il primo parametro del comando deve essere uno tra: " +
				"`QDSS`, `QDSS2`, `QDSSTrash`, `iRognosi`, `QDSSMusic`, `QDSS.it`, `TuttoSbagliato`, `AltroCinema`");
		break;
	}
	
  }
}


/** Wrapper per l'API call di ricerca su YouTube
  * @param keywords - parole chiave della ricerca
  * @param options - parametri per la ricerca (e.g. channelId, maxResults...)
  * @param embedColor - colore con cui decorare l'embed di risposta
  * @param responseChannel - canale in cui inviare l'embed con i risultati
*/
function youtubeSearch(keywords, options, embedColor, responseChannel)
{
	const search = require("youtube-search");
	search(keywords, options, function(err, results)
	{
		if (err) 
		  throw err;		// API error
	
		for (let i = 0; i < 3; i++)
		{
			if (results[i] !== undefined)
			{
			  // Costruzione del messaggio di risposta tramite RichEmbed
			  const embed = new Discord.RichEmbed()
			    .setTitle(results[i].title)
				.setAuthor(results[i].channelTitle)
				.setDescription(results[i].description)
				.setColor(embedColor)
				.setURL(results[i].link)
				.setThumbnail(results[i].thumbnails.medium.url)
				.setTimestamp(results[i].publishedAt);
			  
			  responseChannel.send(embed);
			}
			else if (i == 0)	// Se la ricerca non ha prodotto risultati
			{
			  const noResults = new Discord.RichEmbed()
				.setColor(embedColor)
				.setDescription("0 risultati");
			
			  responseChannel.send(noResults);
			}
		}
  });
}


/** Wrapper per l'API call di ricerca tra i post di un blog Wordpress
  * @param keywords - parole chiave della ricerca
  * @param embedColor - colore con cui decorare l'embed di risposta
  * @param responseChannel - canale in cui inviare l'embed con i risultati
*/
function wordpressSearch(keywords, embedColor, responseChannel)
{
	const WPAPI = require("wpapi");
	const wp = new WPAPI({ endpoint: "https://www.qdss.it/wp-json" });
	const msg = keywords ? "Ricerca di **" + keywords + "** in corso..." 
		: "Ricerca degli ultimi articoli in corso...";
	
	responseChannel.send(msg).then(async (msg) => {
		wp.posts().search(keywords).get(async function(err, results)
		{
			if (err) 
			  throw err;		// API error

			for (let i = 0; i < 3; i++)
			{
				let autore = "";
				let immagine = "";
			
				if (results[i] !== undefined)
				{
				  // Pulizia dei testi da caratteri HTML non interpretati correttamente
				  let title = tools.cleanHTMLstring(results[i].title.rendered);
				  let desc = tools.cleanHTMLstring(results[i].excerpt.rendered);
				  
				  
				  // Query per risalire al nome dell'autore dal suo ID
				  await wp.users().id(results[i].author).get(function(error, data) {
					if (error) throw error;
					else autore = data.name; });
					
				  // Query per ottenere la thumbnail dell'articolo
				  await wp.media().id(results[i].featured_media).get(function(error, media) {
					if (error) throw error;
					else immagine = media.guid.rendered; });
				  
				  
				  // Creazione messaggio di risposta tramite RichEmbed
				  const embed = new Discord.RichEmbed()
					.setTitle(title)
					.setDescription(desc)
					.setAuthor(autore)
					.setThumbnail(immagine)
					.setTimestamp(results[i].date)
					.setURL(results[i].link)
					.setColor(embedColor);

				  responseChannel.send(embed);
				}
				else if (i == 0)	// Se la ricerca non ha prodotto risultati
				{
				  const noResults = new Discord.RichEmbed()
					.setColor(embedColor)
					.setDescription("0 risultati");

				  responseChannel.send(noResults);
				}
			}
			
			msg.delete();	// Eliminazione del messaggio "Ricerca in corso..."
    	});
  	});
}

module.exports = Ricerca;
