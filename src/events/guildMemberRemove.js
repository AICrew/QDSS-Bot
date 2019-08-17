// This event executes when a member leaves the server.

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(member) {
	const QDSS_DB = require("../util/qdss-sqlite.js");
	const db = QDSS_DB.Open();

	console.log("User " + member.id + " (" + member.user.tag + ") left the server");
	
	// Rimozione dei dati dell'utente dal database
	db.removeUser(member.id).then( () => db.close() )
	.catch( (err) => {
		db.close();
		throw err;
	});

  }
};
