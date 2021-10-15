const WEBHOOK_ROOT = '/webhook';
const INFO_ROOT = '/info';
const DOCS_ROOT = '/docs';

const ROUTES = {
	WEBHOOK: {
		SUBSCRIBE: `${WEBHOOK_ROOT}/subscribe`
	},
	INFO: {
		GET: `${INFO_ROOT}/get`,
		LOGS: `${INFO_ROOT}/logs`
	},
	DOCS: {
		API: `${DOCS_ROOT}/api`
	}
};

export default ROUTES;
