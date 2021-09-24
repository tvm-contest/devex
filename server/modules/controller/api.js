const callBackManager = require('../libs/callback.Manager')

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
		// {
		// 	"hash": "bf1699110fd11c234239516511efa2a8e9231f401865f27ed75a1c5693e5f735",
		// 	"data": "dGVzdA=="
		// }

		callBackManager.set(req.body.hash, req.body.data)

		res.send( "Success" );
	},
};

module.exports = coreController;
