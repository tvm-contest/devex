import axios from 'axios';
import WebhookConsumer from '../models/WebhookConsumer';
import Notification from './Notification';

class NotificationsFactory {
	private notificationsQueue: Record<string, Array<Notification>> = {};

	public async createNotification(key: string, value: string): Promise<void> {
		const [hash, nonce, encodedMessage] = value.split(' ');
		const consumer = await WebhookConsumer.findOne({ hash });

		if (!consumer?.endpoint) {
			return;
		}

		if (this.notificationsQueue[consumer.endpoint]?.find(notification => notification.key === key)) {
			return;
		}

		const isEndpointValid = consumer.isValidated || (await this.checkEndpointValidation(consumer.endpoint, consumer.uuid));

		if (!isEndpointValid) {
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

		if (this.notificationsQueue[consumer.endpoint].length === 1) {
			notification.send();
		}
	}

	private async checkEndpointValidation(endpoint: string, uuid: string) {
		const shouldAddSlash = !endpoint.endsWith('/');
		const urlToCheckValidation = `${endpoint}${shouldAddSlash ? '/' : ''}.well-known/i4ins-validation.txt`;

		try {
			const response = await axios.get(urlToCheckValidation);

			return response.data === uuid;
		} catch (e) {
			return false;
		}
	}

	private enqueueNotification(notification: Notification, endpoint: string) {
		if (this.notificationsQueue[endpoint]) {
			this.notificationsQueue[endpoint].push(notification);
		} else {
			this.notificationsQueue[endpoint] = [notification];
		}
	}

	private releaseNotification(endpoint: string): void {
		this.notificationsQueue[endpoint].shift();

		if (this.notificationsQueue[endpoint].length) {
			const nextNotification = this.notificationsQueue[endpoint][0];

			nextNotification.send();
		}
	}
}

const notificationsFactory = new NotificationsFactory();

export default notificationsFactory;
