const jsoning = require("jsoning");
const db = new jsoning("./databases/callBackUrls.json");

const coreController = {
	async set (key, value) {
		await db.set(key, value);
	},
	
	async all() {
		return db.all();
	}
};

module.exports = coreController;