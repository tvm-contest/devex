
/* eslint-disable no-undef */
const express = require( "express" );
const router = express.Router();

const apiController = require( "./modules/api/api.controller");

module.exports = function ( app ) {
	router.get( "/", () => { return { status: true, message: "Welcome to FreeTON Notification Service" } ; } );
	router.get( "/api", apiController.index );
	app.use( "/", router );
};
