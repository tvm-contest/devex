import { Kafka } from 'kafkajs';

import Logger from '../lib/console-logger';
import NotificationsFactory from './NotificationsFactory';

const logger = new Logger();

const kafka = new Kafka({
	clientId: 'i4ins-kafka-client',
	brokers: [process.env.KAFKA_BROKER],
	sasl: {
		mechanism: 'scram-sha-512',
		username: process.env.KAFKA_USERNAME,
		password: process.env.KAFKA_PASSWORD
	}
});

const consumer = kafka.consumer({ groupId: 'i4ins-notifications-consumer' });

const run = async () => {
	await consumer.connect();
	await consumer.subscribe({ topic: 'notifications-7' });

	await consumer.run({
		autoCommit: true,
		autoCommitInterval: 5000,
		autoCommitThreshold: 100,
		eachMessage: async ({ topic, partition, message }) => {
			const messageValue = message.value.toString();
			const messageKey = message.key.toString();

			logger.info(`Message: ${messageValue}`);
			logger.info(`Key: ${messageKey}`);

			await NotificationsFactory.createNotification(messageKey, messageValue);
		}
	});
};

export default run;
