const messageModel = require('./message.model');

const messsageManager = {
	async add (value) {
		const message = new messageModel(value)
		return message.save();
	},

	async delete (id) {
		return await this.setPropery( id, { isDeleted: true })
	},

	async setPropery (id, property) {
		return await messageModel.findOneAndUpdate({ _id: id }, property)
	},
	
	async get(filter = {}) {
		return await messageModel.find(filter).populate("endpoint").sort({ date: -1 }).exec()
	},
};

module.exports = messsageManager;