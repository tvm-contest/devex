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
		res.redirect(302, '/profile');
	},

	async endpoint(req, res) {
		res.json(await endpointManager.get() );
	},
	async endpointSet(req, res) {
		const secret = `${req.body.hash}_${md5(uuidv4())}`;
		const data = toolkit.Base64Decode(req.body.data);

		if(!data.startsWith('http://') && !data.startsWith('https://') && !data.startsWith('telegram://')) {
			res.send(`⚠️ The settings are not saved ⚠️ http(s) and telegram prefix are allowed only ⚠️ 
Example: https://webhook.site/#/a975adce-a3cc-4c90-ad7b-bd2b5e96e4dc/905ed4b3-06c9-4347-a5b9-98191c3c551c/1 or telegram://nrukavkov`);
			return;
		}
		
		if(data.startsWith('http://') || data.startsWith('https://')) {
			await endpointManager.set(req.body.hash, {
				hash: req.body.hash, 
				secret: secret, 
				callbackUrl: data})
		}

		if(data.startsWith('telegram://')) {
			const chatId = data.match(/telegram:\/\/(.*)/i);
			await endpointManager.set(req.body.hash, {
				hash: req.body.hash, 
				secret: secret, 
				telegramChatId: chatId[1]
				})
		}
		
		res.send(`Your endpoint was successfully set. Secret link for log in 
👉 https://freeton-notification-service.voip-lab.ru/login/${secret}. If you use telegram do not forget to set Telegram Api Key on the Profile page.
		
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
		console.log(endpoint);
		res.render("profile", endpoint[0]);
	},

	async ui_profile_save(req, res) {
		var endpoint = await endpointManager.get({ secret: req.cookies.secret });
		await endpointManager.set(endpoint[0].hash, {telegramApiKey: req.body.telegramApiKey, telegramChatId: req.body.telegramChatId, callbackUrl: req.body.callbackUrl})
		endpoint = await endpointManager.get({ secret: req.cookies.secret })
		res.render("profile", endpoint[0]);
	},
};

module.exports = coreController;
