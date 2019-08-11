const Command = require("../../base/Command.js");


/*********************************************
*  REBOOTs the bot, reloading all commands   *
*											                       *
*********************************************/

class Reboot extends Command {
  constructor(client) {
    super(client, {
      name: "reboot",
      description: "If running under PM2, the bot will restart.",
      category: "System",
      usage: "reboot",
      aliases: [],
      permLevel: "Bot Admin"
    });
  }

  async run(message, args, level) {  // eslint-disable-line no-unused-vars
    try {
      await message.reply("Bot is shutting down.");
      this.client.commands.forEach(async cmd => {
        await this.client.unloadCommand(cmd);
      });
      process.exit(1);
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = Reboot;
