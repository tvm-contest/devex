const endpointModel = require('./endpoint.model');

const coreController = {
	async set (hash, changes) {
		return await endpointModel.findOneAndUpdate({hash: hash}, changes , { new: true, upsert: true })
	},

	async get (filter = {}) {
		return await endpointModel.find(filter).exec();
	},

	async userValidation(secret){
		if(await endpointModel.count({secret: secret}) == 1) { return true }
		else { return false }
	},

	async isAdmin(secret){
		if(await endpointModel.count({secret: secret, admin: true}) == 1) { return true }
		else { return false }
	}
};

module.exports = coreController;