const jsoning = require("jsoning");
const db = new jsoning("./databases/callBackUrls.json");

const coreController = {
	async set (key, value) {
		await db.set(key, value);
	},

	async get (key) {
		await db.get(key);
	},
	
	async all() {
		return db.all();
	},

	async clear() {
		db.clear();
	}
};

module.exports = coreController;