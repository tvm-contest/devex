const jsoning = require("jsoning");
const dbsPath = "./databases/callBackUrls.json"

let db = new jsoning(dbsPath);

const set = async (key, value) => {
	await db.set(key, value);
}

module.exports = { set }