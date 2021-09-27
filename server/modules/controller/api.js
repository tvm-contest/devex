const callBackManager = require('../libs/callbackManager')

const coreController = {
	async index(req, res) {
		res.send( 'Say hello to api controller' );
	},

	async hashes(req, res) {
		res.send( await callBackManager.all() );
	},

	async hashesClear(req, res) {
		await callBackManager.clear()
		res.send( await callBackManager.all()  );
	},

	async indexPost(req, res) {
		callBackManager.set(req.body.hash, req.body.data)
		res.send( "Success" );
	},
};

module.exports = coreController;
