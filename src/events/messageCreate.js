// The MESSAGE_CREATE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.

const tools = require("../base/tools.js");
const redis = require("redis");

// Initialize a redis cache to keep track of user messages
const shortTermCache = redis.createClient();
shortTermCache.on("error", (err) => {
	console.error("[node_redis] ERROR: ", err);
});

const { promisify } = require('util');
const getAsyncFromCache = promisify(shortTermCache.get).bind(shortTermCache);


module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(message) 
  {
    // It's good practice to ignore other bots. This also makes your bot ignore 
    // itself and not get into a spam loop (we call that "botception").
    if (message.author.bot) return;

    // Grab the settings for this server from the Enmap
    // If there is no guild, get default conf (DMs)
    const settings = this.client.getSettings(message.guild);

    // For ease of use in commands and functions, we'll attach the settings
    // to the message object, so `message.settings` is accessible.
    message.settings = settings;

    // Any message that does not start with our prefix (set in the config file),
    // instead of getting ignored, is processed by the XP system.
    if (message.content.indexOf(settings.prefix) !== 0 && message.guild !== undefined) 
    {
      // HANDLE XP AND LEVELS
      getAsyncFromCache(message.author.id)	// 60 seconds cache
        .then(async (hit) =>
        {
          // Only 1 message per minute is considered for each user
          if (hit) 
            return;	

          // Update the user's XP and profile level
          await tools.assignXP(message.member, this.client.database);

          // Ignore the message author's ID for the next 60 seconds
          shortTermCache.setex(message.author.id, 60, Date.now());
        })
        .catch( (error) => this.client.logger.error(error));

      return;
	  }

    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Get the user or member's permission level from the elevation.
    const level = this.client.permlevel(message);
    const permLevel = this.client.config.permLevels.find(l => l.level === level);

    // Check whether the command, or alias, exist in the collections defined in app.js.
    const cmd = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command));
	
    // No matching command.
    if (!cmd) return;
	
    // Some commands may not be useable in DMs. This check prevents those commands from running
    // and return a friendly error message.
    if (!message.guild && cmd.conf.guildOnly)
      return message.channel.send("This command is unavailable via private message. Please run this command in a guild.");

    // Check if the user has enough permissions to run the command, and notify if not so.
    if (level < this.client.levelCache[cmd.conf.permLevel]) {
      if (settings.systemNotice === "true") {
        return message.channel.send(`You do not have permission to use this command.
Your permission level is ${level} (${permLevel.name})
This command requires level ${this.client.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`);
      } else return;
    }
    
    // To simplify message arguments, the permLevel is added to the message author object
    // (not member, so it is supported in DMs)
    message.author.permLevel = level;

    message.flags = [];
    while (args[0] && args[0][0] === "-") {
      message.flags.push(args.shift().slice(1));
    }
    
    // If the command exists, **AND** the user has permission, run it (catching possible errors).
    this.client.logger.cmd(`${permLevel.name} ${message.author.username} (${message.author.id}) ran command ${cmd.help.name}`);
    cmd.run(message, args);
  }
};