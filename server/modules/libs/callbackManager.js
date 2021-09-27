const jsoning = require("jsoning");
const db = new jsoning("./databases/callBackUrls.json");

const coreController = {
	async set (key, value) {
		await db.set(key, value);
	},

	async get (key) {
		return await db.get(key);
	},
	
	async all() {
		return await db.all();
	},

	async clear() {
		db.clear();
	}
};

module.exports = coreController;