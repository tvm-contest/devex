
/* eslint-disable no-undef */
const express = require( "express" );
const router = express.Router();
const apiController = require( "./modules/api.controller");
const auth = require('./modules/libs/auth');

module.exports = function ( app ) {
	router.get( "/", apiController.index );
	router.get( "/ping", apiController.ping );

	router.get( "/endpoint", apiController.endpoint );
	router.delete( "/endpoint", apiController.endpointDelete );

	router.get( "/message", apiController.message );
	router.delete( "/message/:id", apiController.messageDelete );
	
	router.post( "/", apiController.endpointSet );

	///// UI /////
	router.get( "/messages", auth.isAuthorized, apiController.messages );
	router.get( "/endpoints", auth.isAuthorized, auth.isAdmin , apiController.endpoints );


	app.use( "/", router );
};
