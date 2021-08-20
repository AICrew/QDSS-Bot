// This event executes when a new member joins a server. Let's welcome them!

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(member) 
  {
    // Load the guild's settings
    const settings = this.client.getSettings(member.guild);
  
    // If welcome is off, don't proceed (don't welcome the user)
    if (settings.welcomeEnabled !== "true") return;

    // Replace the placeholders in the welcome message with actual data
    const welcomeMessage = settings.welcomeMessage.replace("{{user}}", member.user.tag);

    // Send the welcome message to the welcome channel.
    member.guild.channels.cache
      .find(channel => channel.name === settings.welcomeChannel)
      .send(welcomeMessage)
      .catch(err => this.client.logger.error(err));
  }
};
