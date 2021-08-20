// This event executes when a new guild (server) is left.

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(guild) 
  {
    // Log the event
    this.client.logger.log(`Guild has been abandoned: ${guild.name} (${guild.id})`);

    // Well they're gone. Let's remove them from the settings!
    this.client.settings.delete(guild.id);
  }
};
