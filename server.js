const express = require('express')
const bodyParser = require('body-parser')
const cors = require( "cors" )
const configuration = require('./server/modules/libs/configuration')
const queueScheduler = require('./server/modules/message/message.scheduler');

// import the `Kafka` instance from the kafkajs library
const consume = require("./server/modules/libs/kafka")
consume().catch((err) => {
	console.error("error in consumer: ", err)
})

const app = express()

// must parse body before morganBody as body will be logged
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use( cors() );
app.use( express.static( __dirname + "/public" ) );

app.set( "view engine", "pug" );

require( "./server/routes" )( app );
require( "./server/modules/libs/mongodb" );

app.listen( configuration.PORT, function () {
	console.log( "Server listening on port " + configuration.PORT );
} );
 