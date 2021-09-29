const endpointModel = require('./endpoint.model');

const coreController = {
	async set (key, value) {
		return await endpointModel.findOneAndUpdate({hash: key}, {hash: key, url: value}, { new: true, upsert: true })
	},

	async get (filter = {}) {
		return await endpointModel.find(filter);
	}
};

module.exports = coreController;