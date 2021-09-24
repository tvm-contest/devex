const db = require('../libs/database.lib')

const coreController = {
	async index(req, res) {
		res.send( 'Say hello to api controller' );
	},
	async indexPost(req, res) {
		// {
		// 	"hash": "bf1699110fd11c234239516511efa2a8e9231f401865f27ed75a1c5693e5f735",
		// 	"data": "dGVzdA=="
		// }

		db.set(req.body.hash, req.body.data)

		res.send( "Success" );
	},
};

module.exports = coreController;
