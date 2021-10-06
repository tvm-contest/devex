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

// Dev routes
if (process.env.NODE_ENV === 'development') {
	const swaggerUiOptions = {
		customCss: '.swagger-ui .topbar { display: none }'
	};

	router.use('/dev/api-docs', swaggerUi.serve);
	router.get('/dev/api-docs', swaggerUi.setup(apiSpec, swaggerUiOptions));
}

export default router;
