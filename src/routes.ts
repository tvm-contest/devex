import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import apiSpec from '../openapi.json';
import ROUTES from './constants/routes';
import * as WebhookController from './controllers/webhook';
import * as InfoController from './controllers/info';

const router = Router();

// Webhook routes
router.post(ROUTES.WEBHOOK.SUBSCRIBE, WebhookController.subscribe);

// Info routes
router.get(ROUTES.INFO.GET, InfoController.get);
router.get(ROUTES.INFO.LOGS, InfoController.logs);

// Docs routes
const swaggerUiOptions = {
	customCss: '.swagger-ui .topbar { display: none }'
};

router.use(ROUTES.DOCS.API, swaggerUi.serve);
router.get(ROUTES.DOCS.API, swaggerUi.setup(apiSpec, swaggerUiOptions));

export default router;
