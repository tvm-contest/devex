import { Request, RequestHandler } from 'express';
import Joi from '@hapi/joi';
import { v1 as uuidv1 } from 'uuid';
import requestMiddleware from '../../middleware/request-middleware';
import b64toUtfString from '../../lib/b64toUtfString';
import WebhookConsumer from '../../models/WebhookConsumer';

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
	const uuid = uuidv1();
	const endpoint = b64toUtfString(data);

	// eslint-disable-next-line no-console
	console.log(`DATA: ${endpoint}`);
	// eslint-disable-next-line no-console
	console.log(`HASH: ${hash}`);

	const consumer = new WebhookConsumer({ uuid, endpoint, hash });
	await consumer.save();

	res.send(`Notifications will be sent to ${endpoint}`);
};

export default requestMiddleware(subscribe, { validation: { body: subscribeSchema } });
