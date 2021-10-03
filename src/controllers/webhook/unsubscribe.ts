import { Request, RequestHandler } from 'express';
import Joi from '@hapi/joi';
import requestMiddleware from '../../middleware/request-middleware';
import WebhookConsumer from '../../models/WebhookConsumer';

export const unsubscribeSchema = Joi.object().keys({
	uuid: Joi.string().required()
});

interface UnsubscribeReqBody {
	uuid: string;
}

const unsubscribe: RequestHandler = async (req: Request<{}, {}, UnsubscribeReqBody>, res) => {
	const { uuid } = req.body;

	const consumer = await WebhookConsumer.findOne({ uuid });

	if (!consumer) {
		return res.status(404).send({
			error: `No consumer with uuid: ${uuid}`
		});
	}

	await consumer.delete();

	return res.send({
		message: 'Unsubscribed'
	});
};

export default requestMiddleware(unsubscribe, { validation: { body: unsubscribeSchema } });
