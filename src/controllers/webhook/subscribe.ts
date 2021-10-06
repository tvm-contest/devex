import { Request, RequestHandler } from 'express';
import Joi from '@hapi/joi';
import { v1 as uuidv1 } from 'uuid';
import requestMiddleware from '../../middleware/request-middleware';
import WebhookConsumer from '../../models/WebhookConsumer';

export const subscribeSchema = Joi.object().keys({
	data: Joi.string().required()
});

interface SubscribeReqBody {
	data: string;
	hash: string;
}

const subscribe: RequestHandler = async (req: Request<{}, {}, SubscribeReqBody>, res) => {
	const { data: endpoint, hash } = req.body;
	const uuid = uuidv1();

	// eslint-disable-next-line no-console
	console.log(`DATA: ${endpoint}`);
	// eslint-disable-next-line no-console
	console.log(`HASH: ${hash}`);

	// const consumer = new WebhookConsumer({ uuid, endpoint, hash });
	// await consumer.save();

	res.send(`Include the uuid: ${uuid} in the webhook response to verify that you have an access to the requested url`);
};

export default requestMiddleware(subscribe, { validation: { body: subscribeSchema } });
