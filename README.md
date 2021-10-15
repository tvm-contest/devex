# i4ins Free TON Notifications Service
Notifications Service for Free TON Blockchain.
Service PROD version is already deployed here: https://ftns.freeton-stats.org/ and available via Notifications DeBot (Service ID - i4ins)

## Features  
  * Unique identifier and notification parameters - data is stored in MongoDB
  * Guaranteed delivery of notifications - notifications will be delivered even after service shutdown, repeated delivery for 24h in case if webhook consumer unavailable
  * Support for HTTPS protocol
  * Verification of a domain ownership - via adding a validation file in a .well-known folder
  * Logging of events of http notifications for the possibility of displaying them in charts - https://ftns.freeton-stats.org/log/info
  * All HTTP API methods must return a 200 response if the requested operation is successful and corresponding HTTP error code otherwise
  * Module information - available here https://ftns.freeton-stats.org/info/get
  * Well documented with openapi
  * http server with UI is provided for testing purposes

## I. API Documentation
Api documention and schemas are provided here (openapi): https://ftns.freeton-stats.org/docs/api  
## II. Testing
Solution has a Demo server for testing purposes  
Please, follow the guide in the repository: https://github.com/Strafi/free-ton-notifications-service-demo

## III. Installation

#### 1. Clone this repo

```
$ git clone git@github.com:Strafi/free-ton-notifications-service.git i4ins
$ cd i4ins
```

#### 2. Install dependencies

```
$ npm install
```
or  
```
$ yarn
```  
## IV. Environment
To edit environment variables, create a file with name `.env` and copy values below.  
Note: if you are going to use docker-compose, you should also update environment in `.yml` files.

| Var Name  | Type  | Default | Description  |
|---|---|---|---|
| NODE_ENV  | string  | `development` |API runtime environment. eg: `staging`  |
|  PORT | number  | `3000` | Port to run the API server on |
|  MONGO_URL | string  | `mongodb://localhost:27017/ftns` | URL for MongoDB |
|  KAFKA_USERNAME | string  | `undefined` | Your username |
|  KAFKA_PASSWORD | string  | `undefined` | Your password |
|  KAFKA_TOPIC | string  | `undefined` | Your topic |
|  KAFKA_GROUP_ID | string  | `undefined` | Your group id |
|  KAFKA_BROKER | string  | `notification.services.tonlabs.io:29092` | URL for tonlabs kafka broker |
## V. Run production docker image
#### 1. Add your KAFKA_USERNAME and KAFKA_PASSWORD environment variables  
#### 2.1 Using docker-compose

```
$ docker-compose -f docker-compose.prod.yml up
```
#### 2.2 Using docker

```
$ docker pull asolodkov/i4ins
$ docker run -t -i \
      --env NODE_ENV=production \
      --env MONGO_URL=mongodb://localhost:27017/ftns \
      --env KAFKA_USERNAME={YOUR_KAFKA_USERNAME} \
      --env KAFKA_PASSWORD={YOUR_KAFKA_PASSWORD} \
      --env KAFKA_TOPIC={YOUR_KAFKA_TOPIC} \
      --env KAFKA_GROUP_ID={YOUR_KAFKA_GROUP_ID} \
      --env KAFKA_BROKER=notification.services.tonlabs.io:29092 \
      -p 3000:3000 \
      asolodkov/i4ins
```
## VI. Build and run from source

The mongo container is only only available in dev environment. When you build and deploy the docker image, be sure to provide the correct environment variables.

#### 1. Build and run without Docker

```
$ npm run build && npm run start
```  
or  
```
$ yarn build && yarn start
```
#### 2. Run with docker

```
$ docker build -t i4ins .
$ docker run -t -i \
      --env NODE_ENV=production \
      --env MONGO_URL=mongodb://localhost:27017/ftns \
      --env KAFKA_USERNAME={YOUR_KAFKA_USERNAME} \
      --env KAFKA_PASSWORD={YOUR_KAFKA_PASSWORD} \
      --env KAFKA_TOPIC={YOUR_KAFKA_TOPIC} \
      --env KAFKA_GROUP_ID={YOUR_KAFKA_GROUP_ID} \
      --env KAFKA_BROKER=notification.services.tonlabs.io:29092 \
      -p 3000:3000 \
      i4ins
```

#### 3. Run with docker-compose

```
$ docker-compose up
```
---

## VII. Logging
The application uses [winston](https://github.com/winstonjs/winston) as the default logger. The configuration file is at `src/logger.ts`.
* All logs are saved in `./logs` directory and at `/logs` in the docker container.
* The `docker-compose` file has a volume attached to container to expose host directory to the container for writing logs.
* Console messages are prettified
* Each line in error log file is a stringified JSON.

Application logs available here: https://ftns.freeton-stats.org/log/info
