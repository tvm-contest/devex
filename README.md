[![Chat on Telegram](https://img.shields.io/badge/chat-on%20telegram-9cf.svg)](https://t.me/ton_actions_chat)
[<img src="https://avatars3.githubusercontent.com/u/67861283?s=150&u=4536b61595a1b422604fab8a7012092d891278f6&v=4" align="right" width="150">](https://freeton.org/)

# Notifon

Free TON Notification Provider

---

## About

This is an application that provides notifications transmission via the HTTP, Telegram, Email.

## Quick start

### Minimal configuration (`.env` file)

#### To self-launching need to have:

- Registered endpoint to receive requests from DeBot (like https://your-domain.com/endpoint)
- Queue Provider(Kafka) credentials

Yor can ask https://t.me/hi_artem or https://t.me/EkaterinaPantaz to register your provider.

> ℹ️ If you run application just for local development or testing you can ask register http://localhost/endpoint as endpoint to avoid port forwarding and ssl generation

#### `.env`:

```dotenv
KafkaOptions__Host=notification.services.tonlabs.io:29092
KafkaOptions__UserName=YOUR_LOGIN
KafkaOptions__Password=YOUR_PASSWORD
KafkaOptions__Topic=YOUR_TOPIC
```

### Run from sources

> ℹ️ Uses an in-memory queue and Sqlite database. So the processing state is not saved on disk, and not committed Kafka messages can be processed repeatedly

- Make sure that .Net 5.0 is installed (https://dotnet.microsoft.com/download)
- Download or clone repo https://github.com/ton-actions/free-ton-http-notification-provider
- Go to the repository directory and create minimal `.env` file
- Exec `dotnet run --project .\src\Notifon.Server --urls=http://localhost/`
- Application will be started at http://localhost and DeBot endpoint is http://localhost/endpoint
- Configure port forwarding and ssl as needed

### Docker

> ℹ️ Uses an in-memory queue and Sqlite database. So the processing state is not saved on disk, and not committed Kafka messages can be processed repeatedly

- Make sure that Docker Engine is installed and started (https://docs.docker.com/engine/install/)
- Create minimal `.env` file
- Exec `docker run --rm --name notifon --env-file=.env -p 80:80 ghcr.io/ch1sel/free-ton-notify:latest`

### Docker compose (Production-ready solution)

> ℹ️ Uses postgresql, redis, rabbitmq to store state and organize retry policy

- Create some directory for project
-

Download [docker-compose.yaml](https://raw.githubusercontent.com/ch1seL/free-ton-http-notification-provider/main/.docker-compose/docker-compose.yaml?token=ADTL6OODHXLXUW5WOMPPSH3BMK6GY)

- Create minimal `.env` file
- Exec `docker-compose up -d`

## Advanced

### Scaling

Notifon is a scalable application and can be run on as many replicas as you like. See `docker-compose.cluster.yaml` and run clustered
instance:

```shell
docker-compose -f docker-compose.yaml -f docker-compose.cluster.yaml up -d
```    

### EF Core Migrations

---

#### Add migration:

```shell
dotnet ef -p .\src\Notifon.Server.Database\ -s .\src\Notifon.Server\ migrations add MIGRATION_NAME
```

#### Remove last migration:

```shell
dotnet ef -p .\src\Notifon.Server.Database\ -s .\src\Notifon.Server\ migrations remove
```