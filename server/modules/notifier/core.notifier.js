const coreController = {
	async index(req, res) {
		res.send( 'Say hello to core controller' );
	},
};

module.exports = coreController;
