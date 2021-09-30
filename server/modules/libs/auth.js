const endpointManager = require('../endpoint/endpoint.manager')

const authModule = { 
	async isAuthorized(req, res, next) {
		if(typeof(req.cookies.secret) === undefined) return res.status(401).redirect(302, '/auth')
		if(req.cookies.secret === '') return res.status(401).redirect(302, '/auth')
		if(!await endpointManager.userValidation(req.cookies.secret)) return res.status(401).redirect(302, '/auth')
		next();
	}, 
	async isAdmin(req, res, next) {
		if(await endpointManager.isAdmin(req.cookies.secret) == false) {
			return res.status(401).send("Error 401: Access restricted. You are not admin.")
		}
		next();
	}
}

module.exports = authModule;
