const endpointManager = require('./endpoint/endpoint.manager')
const messsageManager = require('./message/message.manager')
const toolkit = require('./libs/toolkit')
const { v4: uuidv4 } = require('uuid');
const md5 = require('md5');

const coreController = {
	async ping(req, res) {
		res.send( "pong" );
	},

	async index(req, res) {
		res.render("index");
	},

	async login(req, res) {		
		if(typeof(req.params.secret) === "undefined" || req.params.secret === '') return res.status(401).render("auth");
		res.cookie('secret',req.params.secret, { maxAge: 900000, httpOnly: true });
		res.redirect(302, '/messages');
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
		res.send(`Your endpoint was successfully set. Secret link for log in 
👉 https://freeton-notification-service.voip-lab.ru/login/${secret}. 
		
Please set notification rules and follow the instructions 
👉 https://github.com/nrukavkov/freeton-notification-service/blob/master/README.md`)
	},
	async endpointDelete(req, res) {
		res.json( await endpointManager.delete(req.params.id) );
	},

	async message(req, res) {
		const secret = req.cookies.secret;
		const secretRaw = secret.split('_');
		const hashRequest = (await endpointManager.isAdmin(secret) ? {}:{hash: secretRaw[0]} )
		res.json( await messsageManager.get(hashRequest) );
		
	},

	async messageDelete(req, res) {
		res.json( await messsageManager.delete(req.params.id) );
	},

	async ui_message(req, res) {
		res.render("messages");
	},

	async ui_endpoint(req, res) {
		res.render("endpoints");
	},

	async ui_auth(req, res) {
		res.render("auth");
	},

	async ui_profile(req, res) {
		const endpoint = await endpointManager.get({ secret: req.cookies.secret })
		res.render("profile", endpoint[0]);
	},
};

module.exports = coreController;
