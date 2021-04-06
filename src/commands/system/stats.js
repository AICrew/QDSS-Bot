const Command = require("../../base/Command.js");
const tools = require("../../base/tools.js")
const { version } = require("discord.js");


/****************************************************************************************
*  This command can be used to get some useful bot performance and usage statistics		*
*																						*
****************************************************************************************/

class Stats extends Command {
  constructor(client) {
    super(client, {
      name: "stats",
      description: "Gives some useful bot statistics.",
	    category: "System",
      usage: "stats",
      permLevel: "Bot Admin"
    });
  }

  async run(message, args, level)   // eslint-disable-line no-unused-vars
  { 
    message.channel.send(`= STATISTICS =
  • Mem Usage  :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
  • Uptime     :: ${tools.formatUptime(this.client.uptime)}
  • Users      :: ${this.client.users.cache.size.toLocaleString()}
  • Servers    :: ${this.client.guilds.cache.size.toLocaleString()}
  • Channels   :: ${this.client.channels.cache.size.toLocaleString()}
  • Discord.js :: v${version}
  • Node       :: ${process.version}`, {code: "asciidoc"});
  }
}

module.exports = Stats;
