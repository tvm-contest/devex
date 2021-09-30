const endpointManager = require('../endpoint/endpoint.manager')

const authModule = { 
	async isAuthorized(req, res, next) {
		if(typeof(req.cookies.secret) === undefined) return res.status(401).send("Error 401: You need to be authorized")
		if(req.cookies.secret === '') return res.status(401).send("Error 401: You need to be authorized")
		if(!await endpointManager.userValidation(req.cookies.secret)) return res.status(401).send("Error 401: Secret is incorrect")
		next();
	}, 
	async isAdmin(req, res, next) {
		if(await endpointManager.isAdmin(req.cookies.secret) == false) {
			res.status(401).send("Error 401: Access restricted. You are not admin.")
		}
		next();
	}
}

module.exports = authModule;
