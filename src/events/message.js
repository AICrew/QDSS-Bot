const tools = require("../base/tools.js");
const redis = require("redis");

const shortTermCache = redis.createClient();
shortTermCache.on("error", (err) => {
	console.error("[node_redis] 60SecondsCache ERROR: ", err);
});

const {promisify} = require('util');
const getAsyncFromCache = promisify(shortTermCache.get).bind(shortTermCache);

const DEBUG_CHANNEL_ID = '445760897407909898';

// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(message) {
    // It's good practice to ignore other bots. This also makes your bot ignore itself
    //  and not get into a spam loop (we call that "botception").
    if (message.author.bot) return;

    // Grab the settings for this server from the Enmap
    // If there is no guild, get default conf (DMs)
    const settings = this.client.getSettings(message.guild);

    // For ease of use in commands and functions, we'll attach the settings
    // to the message object, so `message.settings` is accessible.
    message.settings = settings;

    // Any message that does not start with our prefix (set in the config file)
    // instead of getting ignored, it's processed by the XP system
    if (message.content.indexOf(settings.prefix) !== 0 && message.guild !== undefined) 
	{
		// HANDLE XP AND LEVELS
		getAsyncFromCache(message.author.id)	// 60 seconds cache
		.then( function(hit) 
		{
			if (hit) return;	// Only 1 message per minute is considered for each user
				
			try 
			{
				// Start the corouting that assigns XP to a user
				// and deals with all possible leveling up scenarios
				tools.assignXP(message.member);
				shortTermCache.setex(message.author.id, 60, Date.now());
			}
			catch(err)	// Catching and logging possible errors
			{
				const errorMsg = err.toString();
				message.guild.channels.cache.find(c => c.id === DEBUG_CHANNEL_ID)
					.send("[XP SYSTEM ERROR] " + errorMsg.substring(0, Math.min(errorMsg.length, 1950)) );
			}
		});
		
		return;
	}

    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Get the user or member's permission level from the elevation
    const level = this.client.permlevel(message);

    // Check whether the command, or alias, exist in the collections defined
    // in app.js.
    const cmd = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command));
    // using this const varName = thing OR otherthing; is a pretty efficient
    // and clean way to grab one of 2 values!
	
	// No matching command
	if (!cmd) return;
	
    // Some commands may not be useable in DMs. This check prevents those commands from running
    // and return a friendly error message.
    if (!message.guild && cmd.conf.guildOnly)
      return message.channel.send("This command is unavailable via private message. Please run this command in a guild.");

    if (level < this.client.levelCache[cmd.conf.permLevel]) {
      if (settings.systemNotice === "true") {
        return message.channel.send(`You do not have permission to use this command.
Your permission level is ${level} (${this.client.config.permLevels.find(l => l.level === level).name})
This command requires level ${this.client.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`);
      } else {
        return;
      }
    }
    
    // To simplify message arguments, the author's level is now put on level (not member, so it is supported in DMs)
    // The "level" command module argument will be deprecated in the future.
    message.author.permLevel = level;

    message.flags = [];
    while (args[0] && args[0][0] === "-") {
      message.flags.push(args.shift().slice(1));
    }
    
    // If the command exists, **AND** the user has permission, run it.
    this.client.logger.log(`${this.client.config.permLevels.find(l => l.level === level).name} ` +
    `${message.author.username} (${message.author.id}) ran command ${cmd.help.name}`, "cmd");
    try { cmd.run(message, args, level) }
    catch (err) 
    {
      this.client.logger.error(`Command ${cmd.help.name} encountered an error: ${err}`);
      if (message.guild !== undefined)
      {
        const debugChannel = message.guild.channels.cache.find(c => c.id === DEBUG_CHANNEL_ID);
        if (debugChannel)
          debugChannel.send("Il comando `+" + cmd.help.name + "` ha scatenato l'eccezione *" + err + "*");
      }
	  }
  }
};