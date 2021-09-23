
const morganBody = require('morgan-body');
const express = require('express')
const bodyParser = require('body-parser')
const cors = require( "cors" )
const process = require( "process" )
const dotenv = require( "dotenv" );

dotenv.config();
const app = express()
 
// must parse body before morganBody as body will be logged
app.use(bodyParser.json());
app.use( cors() );
app.use( express.static( __dirname + "/public" ) );

// hook morganBody to express app
morganBody(app);

app.set( "view engine", "pug" );

require( "./server/routes" )( app );

app.listen( process.env.PORT, function () {
	console.log( "Server listening on port " + process.env.PORT );
} );
 