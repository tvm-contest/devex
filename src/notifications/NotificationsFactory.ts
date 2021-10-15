import axios from 'axios';
import Logger from '../lib/console-logger';
import WebhookConsumer from '../models/WebhookConsumer';
import Notification from './Notification';

const logger = new Logger();

class NotificationsFactory {
	private notificationsQueue: Record<string, Array<Notification>> = {};

	public async createNotification(key: string, value: string): Promise<void> {
		const [hash, nonce, encodedMessage] = value.split(' ');
		const consumer = await WebhookConsumer.findOne({ hash });

		if (!consumer?.endpoint) {
			logger.error('Consumer is not defined or has no endpoint');

			return;
		}

		if (this.notificationsQueue[consumer.endpoint]?.find(notification => notification.key === key)) {
			logger.error(`Doubled notification with key ${key}`);

			return;
		}

		const isEndpointValid = consumer.isValidated || (await this.checkEndpointValidation(consumer.endpoint, consumer.uuid));

		if (!isEndpointValid) {
			logger.error(`Endpoint ${consumer.endpoint} is not validated`);

			return;
		}

		if (!consumer.isValidated) {
			consumer.isValidated = true;

			await consumer.save();
		}

		const message = `${nonce} ${encodedMessage}`;

		const notification = new Notification({
			key,
			message,
			destinationUrl: consumer.endpoint,
			onSentSuccess: this.releaseNotification
		});

		this.enqueueNotification(notification, consumer.endpoint);

		console.log(this.notificationsQueue);

		if (this.notificationsQueue[consumer.endpoint].length === 1) {
			notification.send();

			console.log('sent');
		}
	}

	private checkEndpointValidation = async (endpoint: string, uuid: string) => {
		const shouldAddSlash = !endpoint.endsWith('/');
		const urlToCheckValidation = `${endpoint}${shouldAddSlash ? '/' : ''}.well-known/i4ins-validation.txt`;

		try {
			const response = await axios.get(urlToCheckValidation);

			return response && response.data && response.data === uuid;
		} catch (e) {
			return false;
		}
	}

	private enqueueNotification = (notification: Notification, endpoint: string) => {
		if (this.notificationsQueue[endpoint]) {
			this.notificationsQueue[endpoint].push(notification);
		} else {
			this.notificationsQueue[endpoint] = [notification];
		}
	}

	private releaseNotification = (endpoint: string) => {
		this.notificationsQueue[endpoint].shift();

		logger.info('Releasing notification');

		if (this.notificationsQueue[endpoint].length) {
			const nextNotification = this.notificationsQueue[endpoint][0];

			nextNotification.send();
		}
	}
}

const notificationsFactory = new NotificationsFactory();

export default notificationsFactory;
