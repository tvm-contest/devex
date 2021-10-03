import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import apiSpec from '../openapi.json';
import * as WebhookController from './controllers/webhook';

const router = Router();

// Webhook routes
router.post('/webhook/subscribe', WebhookController.subscribe);

// Dev routes
if (process.env.NODE_ENV === 'development') {
	const swaggerUiOptions = {
		customCss: '.swagger-ui .topbar { display: none }'
	};

	router.use('/dev/api-docs', swaggerUi.serve);
	router.get('/dev/api-docs', swaggerUi.setup(apiSpec, swaggerUiOptions));
}

export default router;
