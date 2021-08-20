// This event executes when a member leaves the server.

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(member) 
  {
	  // Log the event 
	  this.client.logger.log(`User ${member.id} (${member.user.tag}) left the server`);

	  // Remove user information from the database
	  const db = this.client.database.open();
	  db.removeUser(member.id)
	    .catch(err => this.client.logger.error(err))
      .finally(() => db.close());
  }  
};
