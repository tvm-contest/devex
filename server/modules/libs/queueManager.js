const jsoning = require("jsoning");
const path = require("path");
const queueFolder = path.join(__filename, "../../../../databases/queue");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const queueManager = {
	async add (value) {
		return fs.writeFileSync(path.join(queueFolder, uuidv4()), value)
	},

	async delete (key) {
		return fs.unlinkSync(path.join(queueFolder, key));
	},
	
	async all() {
		let queueItems = {}

		const queueFiles = fs.readdirSync(queueFolder);
		queueFiles.forEach(file => {
			queueItems[file] = fs.readFileSync(path.join(queueFolder,file),'utf-8');
		});

		return queueItems
	},

	async clear() {
		const queueFiles = fs.readdirSync(queueFolder);
		queueFiles.forEach(file => {
			fs.unlinkSync(file);
		});
	}
};

module.exports = queueManager;