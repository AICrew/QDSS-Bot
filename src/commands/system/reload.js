const Command = require("../../base/Command.js");


/****************************************************************************************
*  Use this command, followed by the name of another command, to RELOAD it's script		*
*  after it has been modified															*
*   - make sure that it has no compiler errors or it won't load							*
*																						*
****************************************************************************************/

class Reload extends Command {
  constructor(client) {
    super(client, {
      name: "reload",
      description: "Reloads a command that has been modified.",
      category: "System",
      usage: "reload [command]",
      permLevel: "Bot Admin"
    });
  }

  async run(message, args, level) {  // eslint-disable-line no-unused-vars
    if (!args || args.size < 1) return message.reply("Must provide a resource to reload. Derp.");
    
    if (args[0] === 'dashboard')
    {
      this.client.site.close();
      delete require.cache[require.resolve("../../util/dashboard.js")];
      require("../../util/dashboard.js")(this.client);

      message.reply(`The dashboard has been reloaded`);
    }
    else 
    {
      const commands = this.client.commands.get(args[0]) || this.client.commands.get(this.client.aliases.get(args[0]));
      if (!commands) return message.reply(`The command \`${args[0]}\` does not exist, nor is it an alias.`);
  
      let response = await this.client.unloadCommand(commands.conf.location, commands.help.name);
      if (response) return message.reply(`Error Unloading: ${response}`);
  
      response = this.client.loadCommand(commands.conf.location, commands.help.name);
      if (response) return message.reply(`Error loading: ${response}`);

      message.reply(`The command \`${commands.help.name}\` has been reloaded`);
    }

  }
}

module.exports = Reload;
