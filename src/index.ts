import {
  ApplicationConfig,
  NotificationProviderApiApplication
} from './application';
import {CleanerService, KafkaService, SenderService} from './services';
require('dotenv').config();

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new NotificationProviderApiApplication(options);
  await app.boot();
  await app.migrateSchema();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  app.service(KafkaService).getValue(app);
  app.service(SenderService).getValue(app);
  app.service(CleanerService).getValue(app);
  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      basePath: '/api',
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST,
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },

    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
