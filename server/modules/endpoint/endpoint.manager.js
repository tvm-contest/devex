const endpointModel = require('./endpoint.model');

const coreController = {
	async set (hash, changes) {
		return await endpointModel.findOneAndUpdate({hash: hash}, changes , { new: true, upsert: true })
	},

	async get (filter = {}) {
		return await endpointModel.find(filter);
	}
};

module.exports = coreController;