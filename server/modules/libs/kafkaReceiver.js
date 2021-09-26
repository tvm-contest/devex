const configurationManager = require('./configurationManager')
const callbackManager = require('./callbackManager')
const queueManager = require('./queueManager')
const { Kafka, logLevel } = require("kafkajs")
const { default: axios } = require('axios')

const clientId = configurationManager.KAFKA_USERNAME
const brokers = [configurationManager.KAFKA_CONNECTION]
const topic = configurationManager.KAFKA_TOPIC

const kafka = new Kafka({
	clientId,
	brokers,
	logLevel: logLevel.WARN,
	sasl: {
		mechanism: configurationManager.KAFKA_MECHANISM,
		username: configurationManager.KAFKA_USERNAME,
		password: configurationManager.KAFKA_PASSWORD,
	},
})

const consumer = kafka.consumer({
	groupId: clientId,
	minBytes: 5,
	maxBytes: 1e6,
	// wait for at most 3 seconds before receiving new data
	maxWaitTimeInMs: 3000,
})

const consume = async () => {
	// first, we wait for the client to connect and subscribe to the given topic
	await consumer.connect()
	await consumer.subscribe({ topic, fromBeginning: true })
	await consumer.run({
		// this function is called every time the consumer gets a new message
		eachMessage: ({ message }) => {
			// here, we just log the message to the standard output
			console.log(`received message: ${message.value}`)
			queueManager.add( message.value.toString() )
		}
	})
}

module.exports = consume