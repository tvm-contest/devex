
const morganBody = require('morgan-body')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require( "cors" )
const configuration = require('./server/modules/core/core.configuration')

// import the `Kafka` instance from the kafkajs library
const consume = require("./server/modules/kafka/kafka.consumer")
consume().catch((err) => {
	console.error("error in consumer: ", err)
})

const app = express()

// must parse body before morganBody as body will be logged
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use( cors() );
app.use( express.static( __dirname + "/public" ) );

// hook morganBody to express app
morganBody(app);

app.set( "view engine", "pug" );

require( "./server/routes" )( app );

app.listen( configuration.PORT, function () {
	console.log( "Server listening on port " + configuration.PORT );
} );
 