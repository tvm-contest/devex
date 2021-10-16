import { RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';

const moduleInfo = {
	name: 'Free TON Notifications Service',
	id: 'i4ins',
	description: 'Notifications Module for Free TON Blockchaing events',
	source: 'https://github.com/Strafi/free-ton-notifications-service',
	surf: '0:e9fd9b03ae67de6c071510bce975bc5a0b6c5451546e6b941723df5787f95877'
};

const get: RequestHandler = async (req, res) => {
	res.send(moduleInfo);
};

export default requestMiddleware(get);
