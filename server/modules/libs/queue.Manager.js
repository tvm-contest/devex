const jsoning = require("jsoning");
const db = new jsoning("./databases/requestsQueue.json");
const { v4: uuidv4 } = require('uuid');

const queueManager = {
	async add (value) {
		await db.set(uuidv4(), value);
	},

	async delete (key) {
		await db.delete(key);
	},
	
	async all() {
		return db.all();
	},

	async clear() {
		db.clear();
	}
};

module.exports = queueManager;