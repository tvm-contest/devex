import { RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';

const logs: RequestHandler = async (req, res) => {
	res.sendFile('/logs/info.log');
};

export default requestMiddleware(logs);
