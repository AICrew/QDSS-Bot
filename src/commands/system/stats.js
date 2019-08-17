const Command = require("../../base/Command.js");
const { version } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");


/*************************************************************************************
*  This command can be used to get some useful bot performance and usage statistics  *
*																					                                           *
*************************************************************************************/

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

  async run(message, args, level) { // eslint-disable-line no-unused-vars
    const duration = moment.duration(this.client.uptime).format(" D [days], H [hrs], m [mins], s [secs]");
    message.channel.send(`= STATISTICS =
  • Mem Usage  :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
  • Uptime     :: ${duration}
  • Users      :: ${this.client.users.size.toLocaleString()}
  • Servers    :: ${this.client.guilds.size.toLocaleString()}
  • Channels   :: ${this.client.channels.size.toLocaleString()}
  • Discord.js :: v${version}
  • Node       :: ${process.version}`, {code: "asciidoc"});
  }
}

module.exports = Stats;
