const endpointManager = require('../endpoint/endpoint.manager')

const authModule = { 
	async isAuthorized(req, res, next) {
		if(typeof(req.cookies.secret) === "undefined" || req.cookies.secret === '') return res.status(401).render("auth");
		if(!await endpointManager.userValidation(req.cookies.secret)) return res.status(401).render("auth", {message: "Error 401: Your secret is incorrect."});
		next();
	}, 
	async isAdmin(req, res, next) {
		if(await endpointManager.isAdmin(req.cookies.secret) == false) {
			res.status(401).render("auth", {message: "This area is only for administators. Provide admin secret or go to hell. "});
		}
		next();
	}
}

module.exports = authModule;
