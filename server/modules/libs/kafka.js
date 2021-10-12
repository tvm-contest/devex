const configurationManager = require('./configuration')
const enpointManager = require('../endpoint/endpoint.manager')
const messsageManager = require('../message/message.manager')
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
	console.log(`Connecting to ${brokers}... (topic: ${topic})`)
	// first, we wait for the client to connect and subscribe to the given topic
	await consumer.connect()
	await consumer.subscribe({ topic, fromBeginning: true })
	await consumer.run({
		// this function is called every time the consumer gets a new message
		eachMessage: async ({ message }) => {
			const rawMessage = message.value.toString();
			// here, we just log the message to the standard output
			console.log(`received message: ${rawMessage}`)
			const rawMessageArray =rawMessage.split(' ')
			const endpoint = await enpointManager.get({hash: rawMessageArray[0]});
			if(typeof endpoint[0].callbackUrl === "undefined" && typeof endpoint[0].telegram.chatId !== "undefined" ) {
				messsageManager.add( {hash: rawMessageArray[0], callbackUrl: "Undefined", nonce: rawMessageArray[1], message: rawMessageArray[2], isDelivered: false, isDeleted:true} )
				return;
			}
			if( endpoint[0].callbackUrl !== "undefined"){
				messsageManager.add( {hash: rawMessageArray[0], callbackUrl: endpoint[0].callbackUrl, nonce: rawMessageArray[1], message: rawMessageArray[2]} )
			}
			if(typeof endpoint[0].telegram.chatId !== "undefined") {
				//https://api.telegram.org/bot[BOT_API_KEY]/sendMessage?chat_id=[MY_CHANNEL_NAME]&text=[MY_MESSAGE_TEXT]
				messsageManager.add( {hash: rawMessageArray[0], callbackUrl: `ttps://api.telegram.org/bot[${endpoint[0].telegram.apiKey}]/sendMessage?chat_id=${endpoint[0].telegram.chatId}&text=${rawMessageArray[2]}`, nonce: rawMessageArray[1], message: rawMessageArray[2]} )
			}
		}
	})
}

module.exports = consume