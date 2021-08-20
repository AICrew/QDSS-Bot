// This event executes when the bot has finished its startup phase.

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run() 
  {
    // Why await here? Because the ready event isn't actually ready, sometimes
    // guild information will come in *after* ready. 1sec is plenty, generally,
    // for all of them to be loaded.
    await this.client.wait(1000);

    // This loop ensures that client.appInfo always contains up to date data
    // about the app's status. This includes whether the bot is public or not,
    // its description, owner, etc. Used for the dashboard amongs other things.
    this.client.appInfo = this.client.application;
    setInterval(() => { this.client.appInfo = this.client.application; }, 60000);

    // Check whether the "Default" guild settings are loaded in the enmap.
    // If they're not, write them in. This should only happen on first load.
    if (!this.client.settings.has("default")) {
      if (!this.client.config.defaultSettings) 
        throw new Error("defaultSettings not present in config.js or settings database. Bot cannot load.");
      this.client.settings.set("default", this.client.config.defaultSettings);
    }
    
    // Set the bot's activity to the default help command.
    this.client.user.setActivity('+help', { type: 'PLAYING' });
 
    // Log that we're ready to serve, so we know the bot accepts commands.
    this.client.logger.ready(`${this.client.user.tag}, ready to serve ${this.client.users.cache.size} users in ${this.client.guilds.cache.size} servers.`); 
  }
};
