import { Model, Schema, model } from 'mongoose';
import TimeStampPlugin, { ITimeStampedDocument } from './plugins/timestamp-plugin';

export interface IWebhookConsumer extends ITimeStampedDocument {
	uuid: string;
	endpoint: string;
	hash?: string;
}

interface IWebhookConsumerModel extends Model<IWebhookConsumer> { }

const schema = new Schema<IWebhookConsumer>({
	uuid: {
		type: String,
		index: true,
		required: true,
		unique: true
	},
	endpoint: {
		type: String,
		index: true,
		required: true,
		unique: true
	},
	hash: {
		type: String,
		index: true,
		unique: true
	}
});

schema.plugin(TimeStampPlugin);

const WebhookConsumer: IWebhookConsumerModel = model<IWebhookConsumer, IWebhookConsumerModel>('WebhookConsumer', schema);

export default WebhookConsumer;
