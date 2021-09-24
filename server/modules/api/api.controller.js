const coreController = {
	async index(req, res) {
		res.send( 'Say hello to api controller' );
	},
	async indexPost(req, res) {
		
		res.send( JSON.stringify(req.body));
	},
};

module.exports = coreController;
