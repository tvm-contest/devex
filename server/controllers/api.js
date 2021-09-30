const endpointManager = require('../modules/endpoint/endpoint.manager')
const messsageManager = require('../modules/message/message.manager')
const toolkit = require('../modules/libs/toolkit')
const { v4: uuidv4 } = require('uuid');
const md5 = require('md5');

const coreController = {
	async ping(req, res) {
		res.send( 'pong' );
	},

	async index(req, res) {
		res.render("index");
	},

	async endpoint(req, res) {
		res.json(await endpointManager.get() );
	},
	async endpointSet(req, res) {
		const secret = `${req.body.hash}_${md5(uuidv4())}`;
		await endpointManager.set(req.body.hash, {
			hash: req.body.hash, 
			secret: secret, 
			url: toolkit.Base64Decode(req.body.data)})
		res.send(`Your endpoint was successfully set. Your SECRET for https://freeton-notification-service.voip-lab.ru/ is ${secret}. Please set notification rules and follow the instructions https://github.com/nrukavkov/freeton-notification-service/blob/master/README.md`)
	},
	async endpointDelete(req, res) {
		res.json( await endpointManager.delete(req.params.id) );
	},

	async message(req, res) {
		res.json( await messsageManager.get() );
	},

	async messageDelete(req, res) {
		res.json( await messsageManager.delete(req.params.id) );
	},

	async messages(req, res) {
		res.render("messages");
	},

	async endpoints(req, res) {
		res.render("endpoints");
	},
};

module.exports = coreController;
