import { Request, RequestHandler } from 'express';
import Joi from '@hapi/joi';
import { v1 as uuidv1 } from 'uuid';
import { SAME_ORIGIN } from '../../constants';
import requestMiddleware from '../../middleware/request-middleware';
import b64toUtfString from '../../lib/b64toUtfString';
import Logger from '../../lib/console-logger';
import WebhookConsumer from '../../models/WebhookConsumer';

const logger = new Logger();

const formSubscribeSuccessResponse = (endpoint: string, uuid: string): string => `Notifications will be sent to ${endpoint}, but you have to prove the domain ownership.
	\nPlease, create the file i4ins-validation.txt inside your domain .well-known directory and put there the following string: ${uuid}`;

export const subscribeSchema = Joi.object().keys({
	data: Joi.string().required(),
	hash: Joi.string().required()
});

interface SubscribeReqBody {
	data: string;
	hash: string;
}

const subscribe: RequestHandler = async (req: Request<{}, {}, SubscribeReqBody>, res) => {
	const { data, hash } = req.body;
	const utfData = b64toUtfString(data);
	const url = new URL(utfData);
	const isDefaultValidated = url.origin === SAME_ORIGIN;
	console.log('ORIGIN: ', url.origin);
	const { href: endpoint } = url;
	let uuid = uuidv1();

	logger.info(`ENDPOINT: ${endpoint}`);
	logger.info(`HASH: ${hash}`);

	const consumerWithHashInDB = await WebhookConsumer.findOne({ hash });

	if (consumerWithHashInDB) {
		consumerWithHashInDB.endpoint = endpoint;
		consumerWithHashInDB.isValidated = isDefaultValidated;
		uuid = consumerWithHashInDB.uuid;

		await consumerWithHashInDB.save();

		console.dir(consumerWithHashInDB);
	} else {
		const consumer = new WebhookConsumer({
			uuid,
			endpoint,
			hash,
			isValidated: isDefaultValidated
		});
		await consumer.save();
	}

	res.send(formSubscribeSuccessResponse(endpoint, uuid));
};

export default requestMiddleware(subscribe, { validation: { body: subscribeSchema } });
