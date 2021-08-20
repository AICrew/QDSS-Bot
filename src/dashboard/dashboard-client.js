const { Client, Intents } = require("discord.js");

class QdssDashboard extends Client {
  constructor(options) {
    super(options);

    // Here we load the config.js file that contains our token and our prefix values.
    this.config = require("./../config");
    // client.config.token contains the bot's token
    // client.config.prefix contains the message prefix

    // Add the database handle to the dashboard client, for ease of access.
    this.database = require("./dashboard-sqlite.js");
  }
}

const client = new QdssDashboard(
  { intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MEMBERS,
    //Intents.FLAGS.GUILD_BANS,
    //Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    //Intents.FLAGS.GUILD_INTEGRATIONS,
    //Intents.FLAGS.GUILD_WEBHOOKS,
    //Intents.FLAGS.GUILD_INVITES,
    //Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_PRESENCES,
    //Intents.FLAGS.GUILD_MESSAGES,
    //Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    //Intents.FLAGS.GUILD_MESSAGE_TYPING,
    //Intents.FLAGS.DIRECT_MESSAGES,
    //Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    //Intents.FLAGS.DIRECT_MESSAGE_TYPING
  ]}
);

client.login(client.config.token);
client.on('ready', () => {console.log("dashboard ready")})

module.exports = { client: client };
