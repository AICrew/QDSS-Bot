const dbFile = '../../database/sqlite.db';
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	
	/** Creates a SQLite database object and adds to it the promisified versions
	  *  of GET, ALL and RUN methods, in order to enable async/await or .then()
	  * @return database : a valid SQLite promisified database handle
	*/
	Open : function ()
	{
		const database = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE);
		
		// Promisified version of Database#get(sql, [param, ...], [callback])
		database.getAsync = function (sql, params = undefined)
		{
			return new Promise( (resolve, reject) => {
				this.get(sql, params, function (err, row) {
					if (err) reject(err);
					else resolve(row);
				});
			})
		};

		// Promisified version of Database#all(sql, [param, ...], [callback])
		database.allAsync = function (sql, params = undefined)
		{
			return new Promise( (resolve, reject) => {
				this.all(sql, params, function (err, rows) {
					if (err) reject(err);
					else resolve(rows);
				});
			})
		};

		// Promisified version of Database#run(sql, [param, ...], [callback])
		database.runAsync = function (sql, params = undefined)
		{
			return new Promise( (resolve, reject) => {
				this.run(sql, params, function (err) {
					if (err) reject(err);
					else resolve();
				});
			})
		};
		
		
		/** Queries the database for the existence of a user, and if not present
		  * it proceeds with insertion of the user data
		  * @param userId : Discord.js snowflake representing a user
		  * @param username : the Discord username of the user
		  * @return a Promise<> representing the completion of the operation
		*/
		database.insertUserIfNotExists = function (userId, username)
		{
			return new Promise( (resolve, reject) => {
				this.getAsync("SELECT * FROM Utenti WHERE userId = ?", [userId])
					.then( (user) => {
						if (!user) return this.runAsync("INSERT INTO Utenti (userId, username) VALUES(?,?)", [userId, username]) })
					.then( () => resolve() )
					.catch( (err) => reject(err) );
			})
		};
		
		
		/** Removes a user from the database, proceeding in order to
		  * ensure that integrity constraints are not violated
		  * @param userId : Discord.js snowflake representing the user to remove
		  * @return a Promise<> representing the completion of the operation
		*/
		database.removeUser = function (userId)
		{
			return new Promise( (resolve, reject) => {
				this.runAsync("DELETE FROM Esperienza WHERE userId = ?", [userId])
					.then( () => this.runAsync("DELETE FROM Reputazione WHERE userTo = ?", [userId]))
					.then( () => this.runAsync("DELETE FROM Registrazioni WHERE userId = ?", [userId]))
					.then( () => this.runAsync("DELETE FROM Utenti WHERE userId = ?", [userId]))
					.then( () => resolve() )
					.catch( (err) => reject(err) );
			})
		};
		
		return database;
	}
	
}