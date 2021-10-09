import { Kafka } from 'kafkajs';

const kafka = new Kafka({
	clientId: 'i4ins-kafka-client',
	brokers: [process.env.KAFKA_BROKER],
	sasl: {
		mechanism: 'scram-sha-512',
		username: process.env.KAFKA_USERNAME,
		password: process.env.KAFKA_PASSWORD
	}
});

export const consumer = kafka.consumer({ groupId: 'i4ins-notifications-consumer' });

const run = async () => {
	await consumer.connect();
	await consumer.subscribe({ topic: 'notifications-7', fromBeginning: true });

	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			console.log(topic);
			console.log(message);
			console.log({
				partition,
				offset: message.offset,
				value: message.value.toString()
			});
		}
	});
};

run().catch(err => console.error(err));

export default kafka;
