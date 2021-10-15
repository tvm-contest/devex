import { Kafka } from 'kafkajs';

import logger from '../logger';
import NotificationsFactory from './NotificationsFactory';

const kafka = new Kafka({
	clientId: 'i4ins-kafka-client',
	brokers: [process.env.KAFKA_BROKER],
	sasl: {
		mechanism: 'scram-sha-512',
		username: process.env.KAFKA_USERNAME,
		password: process.env.KAFKA_PASSWORD
	}
});

const topic = process.env.KAFKA_TOPIC || 'notifications-7';
const groupId = process.env.KAFKA_GROUP_ID || 'i4ins-notifications-consumer';

const consumer = kafka.consumer({ groupId });

const logMessage = (messageValue: string) => {
	const [hash, nonce, encodedMessage] = messageValue.split(' ');

	const logObj = {
		hash,
		nonce,
		message: encodedMessage
	};

	logger.verbose(JSON.stringify(logObj));
};

const run = async () => {
	await consumer.connect();
	await consumer.subscribe({ topic });

	await consumer.run({
		autoCommit: true,
		autoCommitInterval: 5000,
		autoCommitThreshold: 100,
		eachMessage: async ({ message }) => {
			const messageValue = message.value.toString();
			const messageKey = message.key.toString();

			logMessage(messageValue);

			await NotificationsFactory.createNotification(messageKey, messageValue);
		}
	});
};

export default run;
