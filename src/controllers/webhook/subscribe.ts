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

	const consumer = new WebhookConsumer({ uuid, endpoint, hash });
	await consumer.save();

	res.send({
		message: 'Include the uuid in webhook response to verify that you have an access to the requested url',
		url: consumer.endpoint,
		uuid: consumer.uuid
	});
};

export default requestMiddleware(subscribe, { validation: { body: subscribeSchema } });
