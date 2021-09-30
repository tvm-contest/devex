
/* eslint-disable no-undef */
const express = require( "express" );
const router = express.Router();
const apiController = require( "./modules/api.controller");
const auth = require('./modules/libs/auth');

module.exports = function ( app ) {
	router.get( "/", apiController.index );
	router.get( "/ping", apiController.ping );

	router.get( "/endpoint", auth.isAuthorized , auth.isAdmin , apiController.endpoint );
	router.delete( "/endpoint:id", auth.isAuthorized , auth.isAdmin, apiController.endpointDelete );

	router.get( "/message", auth.isAuthorized , apiController.message );
	router.delete( "/message/:id", auth.isAuthorized ,apiController.messageDelete );
	
	router.post( "/", apiController.endpointSet );

	///// UI /////
	router.get( "/messages", auth.isAuthorized, apiController.ui_message );
	router.get( "/endpoints", auth.isAuthorized, auth.isAdmin , apiController.ui_endpoint );
	router.get( "/auth", apiController.ui_auth );

	app.use( "/", router );
};
