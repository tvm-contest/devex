const WEBHOOK_ROOT = '/webhook';
const INFO_ROOT = '/info';
const DOCS_ROOT = '/docs';
const LOGS_ROOT = '/logs';

const ROUTES = {
	WEBHOOK: {
		SUBSCRIBE: `${WEBHOOK_ROOT}/subscribe`
	},
	INFO: {
		GET: `${INFO_ROOT}/get`
	},
	DOCS: {
		API: `${DOCS_ROOT}/api`
	},
	LOGS: {
		INFO: `${LOGS_ROOT}/info`
	}
};

export default ROUTES;
