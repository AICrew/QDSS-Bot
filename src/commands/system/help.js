const Command = require("../../base/Command.js");
const { Formatters, Util } = require("discord.js");


/********************************************************************************
*  The HELP command is used to display every command's name and description     *
*  to the user, so that he may see what commands are available.	If a            *
*  command name is given with the help command, its extended help is shown.     *
*   - The help command is also filtered by level, so if a user does not have    *
*   access to	a command, it is not shown to them.                               *
*                                                                               *
********************************************************************************/

class Cmd_Help extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      description: "Displays all the available commands for you.",
      category: "System",
      usage: "help [command]",
      aliases: ["h", "halp"]
    });
  }

  async run(message, args) {
    
    // If no specific command is called, show all filtered commands.
    if (!args[0]) 
	  {
      // Load guild settings (for prefixes and eventually per-guild tweaks)
      const settings = message.settings;

      // Filter all commands by which are available for the user's level, using the <Collection>.filter() method.
      const level = message.author.permLevel;
      const myCommands = message.guild ? 
		    this.client.commands.filter(cmd => this.client.levelCache[cmd.conf.permLevel] <= level) :
		    this.client.commands.filter(cmd => this.client.levelCache[cmd.conf.permLevel] <= level &&  cmd.conf.guildOnly !== true);
      
      // Apply a reduce() operation on the commands to find out the longest name.
      // This make the help commands "aligned" in the output.
      const longest = myCommands.reduce((long, value, key) => Math.max(long, key.length), 0);
      let currentCategory = "";
      let output = `= Command List =\n\n[Use ${this.client.config.defaultSettings.prefix}help <commandname> for details]\n`;
      const sorted = myCommands.sort((p, c) => p.help.category > c.help.category ? 1 : p.help.name > c.help.name && p.help.category === c.help.category ? 1 : -1 );
      sorted.forEach( c => {
        const cat = c.help.category.toProperCase();
        if (currentCategory !== cat) {
          output += `\u200b\n== ${cat} ==\n`;
          currentCategory = cat;
        }
        output += `${settings.prefix}${c.help.name}${" ".repeat(longest - c.help.name.length)} :: ${c.help.description}\n`;
      });
      for (const str of Util.splitMessage(output, { char: "\u200b", maxLength: 1950 }))
        message.channel.send(Formatters.codeBlock("asciidoc", str));
    } 
    else {
      // Show individual command's help.
      let command = args[0];
      if (this.client.commands.has(command)) {
        command = this.client.commands.get(command);
        if (level < this.client.levelCache[command.conf.permLevel]) return;
        message.channel.send(Formatters.codeBlock("asciidoc", 
          `= ${command.help.name} = \n${command.help.description}\nusage:: ${command.help.usage}\naliases:: ${command.conf.aliases.join(", ")}`));
      }
    }
  }
}

module.exports = Cmd_Help;
