[![Chat on Telegram](https://img.shields.io/badge/chat-on%20telegram-9cf.svg)](https://t.me/ton_actions_chat)
[<img src="https://avatars3.githubusercontent.com/u/67861283?s=150&u=4536b61595a1b422604fab8a7012092d891278f6&v=4" align="right" width="150">](https://freeton.org/)

# Notifon

Free TON Notification Provider

---

## About

This is an application that provides messages transmission via the **HTTP**, **Telegram**, **Email**.

---

## Quick start

### Minimal configuration (`.env` file)

#### To self-launching need to have:

- Registered endpoint to receive requests from Notification DeBot (like https://your-domain.com/endpoint)
- Queue Provider(Kafka) credentials

Yor can ask https://t.me/hi_artem or https://t.me/EkaterinaPantaz to register your provider.

> ℹ️ If you run application just for local development or testing you can ask register http://localhost/endpoint as endpoint to avoid port forwarding and ssl generation etc.

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
- Go to the repository directory and create [minimal .env](#env) file
- Exec `dotnet run --project .\src\Notifon.Server --urls=http://localhost/`
- Application will be started at http://localhost and DeBot endpoint is http://localhost/endpoint
- Configure port forwarding and ssl as needed

### Docker

> ℹ️ Uses an in-memory queue and Sqlite database. So the processing state is not saved on disk, and not committed Kafka messages can be processed repeatedly

- Make sure that Docker Engine is installed and started (https://docs.docker.com/engine/install/)
- Create [minimal .env](#env) file
- Exec `docker run --rm --name notifon --env-file=.env -p 80:80 ghcr.io/ch1sel/free-ton-notify:latest`

### Docker compose (Production-ready solution)

> ℹ️ Uses postgresql, redis, rabbitmq to store state and organize retry policy

- Create some directory for project
-

Download [docker-compose.yaml](https://raw.githubusercontent.com/ch1seL/free-ton-http-notification-provider/main/.docker-compose/docker-compose.yaml?token=ADTL6OODHXLXUW5WOMPPSH3BMK6GY)

- Create [minimal .env](#env) file
- Exec `docker-compose up -d`

---

## Advanced

### Retry policies

All messages from Kafka consuming and publishing to separate provider queues. Each queue has its own delivery and retries, so we can be sure
that all messages will be delivered. The default retry policy is 144 times at 10 minute intervals. Configure retry policy
with `RetryPolicyOptions__Count` and `RetryPolicyOptions__Interval` variables.

### Scaling

Notifon is a scalable application and can be run on as many replicas as you like. See `docker-compose.cluster.yaml` and try clustered
instance `docker-compose -f docker-compose.yaml -f docker-compose.cluster.yaml up -d`

### Environment variables

|        **Variable**           |                       **Description**                         |
|-------------------------------|---------------------------------------------------------------|
| ASPNETCORE_ENVIRONMENT        | Development, Staging, Production. Set logging levels and etc. |
| COMING_SOON                   | Disable accepting DeBot command Default: false                |
| TelegramOptions__BotToken     | Default token for telegram provider Default: not set          |
| MailGunOptions__ApiKey        | Default Mailgun Api Key Default: not set                      |
| MailGunOptions__Domain        | Default Mailgun Domain Default: not set                       |
| MailGunOptions__From          | Default From address Default: not set                         |
| MailGunOptions__Subject       | Default Email subject Default: not set                        |
| RedisOptions__Configuration   | Redis configuration Default: not set                          |
| RabbitMqOptions__Host         | RabbitMq host address Default: not set                        |
| RabbitMqOptions__Username     | RabbitMq user name Default: not set                           |
| RabbitMqOptions__Password     | RabbitMq password Default: not set                            |
| ConnectionStrings__PostgreSql | PostgreSql connection string Default: not set                 |
| RetryPolicyOptions__Count     | Retry count (0-no retries) Default: 144                       |
| RetryPolicyOptions__Interval  | Retry interval (TimeSpan format) Default: 00:10:00            |

## Deployment

- Make sure that .Net 5.0 is installed (https://dotnet.microsoft.com/download)
- Make sure you have ssh access to the server and rsync is installed
- Create [minimal .env](#env) file on server app directory
- Edit Server and ServerPath properties in Notifon.Deploy.proj or pass them as arguments

#### Sample commands for deploy:

- Deploy and run app on YOU_SERVER:
  `dotnet build .\Notifon.Deploy.proj -p:Server:YOU_NAME@YOU_SERVER -p:ServerPath=~/app`

- Build and push image then deploy and run app:
  `dotnet build .\Notifon.Deploy.proj -t:Push,Deploy -p:Server:YOU_NAME@YOU_SERVER -p:ServerPath=~/app -p:ImageName=[registry/]app_image_name`

---

## TODO

- Sentry integration
- Grafana Dashboard for Message Queues
- Helm chart for easy Kubernetes deployment
- Plugin architecture for providers
- DeBot interaction from app

---

## Development

There is an application architectural diagram:

TBD

### EF Core Migrations

#### Add migration:

```shell
dotnet ef -p .\src\Notifon.Server.Database\ -s .\src\Notifon.Server\ migrations add MIGRATION_NAME
```

#### Remove last migration:

```shell
dotnet ef -p .\src\Notifon.Server.Database\ -s .\src\Notifon.Server\ migrations remove
```