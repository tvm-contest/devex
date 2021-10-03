const WEBHOOK_ROOT = '/webhook';
const INFO_ROOT = '/info';

const ROUTES = {
	WEBHOOK: {
		SUBSCRIBE: `${WEBHOOK_ROOT}/subscribe`
	},
	INFO: {
		GET: `${INFO_ROOT}/get`
	}
};

export default ROUTES;
