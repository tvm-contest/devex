const configuration = require('./configuration.Manager')
const { Kafka, logLevel } = require("kafkajs")

const clientId = configuration.KAFKA_USERNAME
const brokers = [configuration.KAFKA_CONNECTION]
const topic = configuration.KAFKA_TOPIC

const kafka = new Kafka({
	clientId,
	brokers,
	// logCreator: customLogger,
	logLevel: logLevel.WARN,
	sasl: {
		mechanism: configuration.KAFKA_MECHANISM,
		username: configuration.KAFKA_USERNAME,
		password: configuration.KAFKA_PASSWORD,
	},
})

// the kafka instance and configuration variables are the same as before

// create a new consumer from the kafka client, and set its group ID
// the group ID helps Kafka keep track of the messages that this client
// is yet to receive
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
		},
	})
}

module.exports = consume