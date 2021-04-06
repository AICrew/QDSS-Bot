const Command = require("../../base/Command.js");


/************************************************************************************
* Shows the permission level (0...10) for this bot to the user calling the command	*
*																					*
************************************************************************************/

class MyLevel extends Command {
  constructor(client) {
    super(client, {
      name: "mylevel",
      description: "Displays your permission level for your location.",
	  category: "System",
      usage: "mylevel",
      permLevel: "Bot Admin"
    });
  }

  async run(message, args, level) {
    const friendly = this.client.config.permLevels.find(l => l.level === level).name;
    message.reply(`Your permission level is: ${level} - ${friendly}`);
  }
}

module.exports = MyLevel;
