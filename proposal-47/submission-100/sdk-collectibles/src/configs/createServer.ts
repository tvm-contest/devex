import { createExpressServer, useContainer as routingControllersUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { SeriesController } from '../features/Series/SeriesController';
import { ResponseInterceptor } from '../interceptors/ResponseInterceptor';
import { CorsMiddleware } from '../middlewares/CorsMiddleware';
import { ImagesController } from "../features/Images/ImagesController";

// eslint-disable-next-line @typescript-eslint/ban-types
export const createServer = (params?: {controllers?: Function[]; middlewares?: Function[];}) => {
  const { PORT } = process.env;

  routingControllersUseContainer(Container);

  const app = createExpressServer({
    routePrefix: '/sdk',
    controllers: [SeriesController, ImagesController, ...(params?.controllers ? params.controllers : [])],
    interceptors: [ResponseInterceptor],
    middlewares: [CorsMiddleware, ...(params?.middlewares ? params.middlewares : [])],
  });

  app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
  });

  return app;
};
