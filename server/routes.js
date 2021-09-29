
/* eslint-disable no-undef */
const express = require( "express" );
const router = express.Router();

const apiController = require( "./controllers/api");

module.exports = function ( app ) {
	router.get( "/", apiController.index );
	router.get( "/ping", apiController.ping );

	router.get( "/endpoint", apiController.endpoint );
	router.delete( "/endpoint", apiController.endpointDelete );

	router.get( "/message", apiController.message );
	router.delete( "/message/:id", apiController.messageDelete );
	
	router.post( "/", apiController.endpointSet );
	app.use( "/", router );
};
