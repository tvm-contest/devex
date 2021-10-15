import axios from 'axios';

import Logger from '../lib/console-logger';
import NOTIFICATION from '../constants/notification';

const logger = new Logger();

type TOnSentSuccess = (endpoint: string) => void;

interface INotificationConstructor {
	key: string;
	message: string;
	destinationUrl: string;
	onSentSuccess: TOnSentSuccess;
}

class Notification {
	public key: string;

	private message: string;

	private destinationUrl: string;

	private retryCount: number = 0;

	private onSentSuccess: TOnSentSuccess;

	constructor({
		key,
		message,
		destinationUrl,
		onSentSuccess
	}: INotificationConstructor) {
		this.onSentSuccess = onSentSuccess;
		this.key = key;
		this.message = message;
		this.destinationUrl = destinationUrl;
	}

	send() {
		console.log('MESSAGE BEFORE SEND: ', this.message);

		axios.post(this.destinationUrl, { message: this.message })
			.then(() => this.onSentSuccess(this.destinationUrl))
			.catch(() => this.retry());
	}

	private retry() {
		this.retryCount += 1;

		if (this.retryCount > NOTIFICATION.MAX_RETRY_COUNT) {
			logger.warn(`Endpoint ${this.destinationUrl} is not available for 24 hours`);

			return;
		}

		logger.warn(`Retry delivery to ${this.destinationUrl}`);

		setTimeout(() => this.send(), NOTIFICATION.RETRY_TIMEOUT);
	}
}

export default Notification;
