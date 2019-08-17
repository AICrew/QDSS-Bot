<<<<<<< HEAD
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
=======
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
>>>>>>> c1bd1e63e504a0789d4cf8ceda6a45c30fd02dd1
