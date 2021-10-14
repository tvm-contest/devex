[![Chat on Telegram](https://img.shields.io/badge/chat-on%20telegram-9cf.svg)](https://t.me/ton_actions_chat)
[<img src="https://avatars3.githubusercontent.com/u/67861283?s=150&u=4536b61595a1b422604fab8a7012092d891278f6&v=4" align="right" width="150">](https://freeton.org/)

# TON Actions.Notifon

Free TON Notification Provider

---

## Features

- Supported endpoint types: **HTTP**, **Telegram**, **Email**, **Firebase Cloud Messages(FCM)**.
- Horizontally scalable
- Customizable retry policy for failed requests
- Multiple endpoints per user support
- Optional message decryption for specified endpoints
- DeBot parameters
    - help
    - add/remove/clear/list endpoints
    - get/set/remove secret key
- Frontend client-side application
    - Server Status
    - Test HTTP consumers
    - Test message sender
- Configure all the service parameters in just one **.env** file
- Easy to integrate with Grafana(Prometheus /metrics endpoint)
    - Application resources (MEM, CPU, etc)
    - Message Queues statistics
- Docker supported
- Sentry integration

---

## Quick start

### Minimal configuration (`.env` file)

#### To self-launching need to have:

- Registered endpoint to receive requests from Notification DeBot (like https://your-domain.com/endpoint)
- Queue Provider(Kafka) credentials

Yor can ask https://t.me/hi_artem or https://t.me/EkaterinaPantaz to register your provider.

> 💡 If you run application just for local development or testing you may ask register http://localhost/endpoint as endpoint to avoid port forwarding and ssl generation etc.

#### `.env`:

```dotenv
KafkaOptions__Host=notification.services.tonlabs.io:29092
KafkaOptions__UserName=YOUR_LOGIN
KafkaOptions__Password=YOUR_PASSWORD
KafkaOptions__Topic=YOUR_TOPIC
```

### Run from sources

> 💡 Uses an in-memory queue and Sqlite database. So the processing state is not saved on disk, and not committed Kafka messages can be processed repeatedly after restarting

- Make sure that .Net 5.0 is installed (https://dotnet.microsoft.com/download)
- Download or clone repo https://github.com/ton-actions/free-ton-http-notification-provider
- Go to the repository directory and create [minimal .env](#env) file
- Exec `dotnet run --project .\src\Notifon.Server --urls=http://localhost/`
- Application will be started at http://localhost and DeBot endpoint is http://localhost/endpoint
- Configure port forwarding and ssl as needed

### Docker

> 💡 Uses an in-memory queue and Sqlite database. So the processing state is not saved on disk, and not committed Kafka messages can be processed repeatedly after restarting

- Make sure that Docker Engine is installed and started (https://docs.docker.com/engine/install/)
- Create [minimal .env](#env) file
- Exec `docker run --rm --name notifon --env-file=.env -p 80:80 ghcr.io/ch1sel/free-ton-notify:latest`

### Docker compose (Production-ready solution)

> 💡 Uses postgresql, redis, rabbitmq to store state and organize retry policy

- Create some directory for project
- Download
  [docker-compose.yaml](https://raw.githubusercontent.com/ton-actions/free-ton-http-notification-provider/main/.docker-compose/docker-compose.yaml)
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

### Endpoint configuration

In general services require token and another props to accept payloads. The Notifon app is able to deliver messages to various endpoints
with two main approaches. First one is using user tokens which provided as endpoint parameters during registration in the Notification
DeBot. And second, if user tokens weren't provided used application tokens, can be set via [environment variables](#Environment-variables).
If no tokens were provided at all, then messages will not be delivered.

### Environment variables

|                Variable               |                     Description                    |                                  Default                                 |
|:--------------------------------------|:---------------------------------------------------|:-------------------------------------------------------------------------|
| ASPNETCORE_ENVIRONMENT                | Set logging levels and etc.(Staging, Production)   | Development                                                              |
| App_Name                              | App Name                                           | Notifon                                                                  |
| App_Url                               | App Url                                            | https://notify-contest.ddns.net/                                         |
| App_Github                            | Github repository link                             | https://github.com/..                                                    |
| App_Telegram                          | Telegram support link                              | https://t.me/ton_actions_chat                                            |
| App_ServicePurpose                    | Main page title                                    | Free TON Notification Provider                                           |
| App_ServiceDescription                | More service description for main page             | Catching messages from the blockchain and send them to various endpoints |
| App_NotificationDeBot                 | Surf Notification DeBot address                    | https://web.ton.surf/debot?address=0%3A43..3ae3&net=devnet               |
| COMING_SOON                           | Disable accepting DeBot command                    | false                                                                    |
| Telegram__BotToken                    | Default token for telegram provider                | not set                                                                  |
| MailGun__ApiKey                       | Default Mailgun Api Key                            | not set                                                                  |
| MailGun__Domain                       | Default Mailgun Domain                             | not set                                                                  |
| MailGun__From                         | Default From address                               | not set                                                                  |
| MailGun__Subject                      | Default Email subject                              | not set                                                                  |
| Redis__Configuration                  | Redis configuration                                | not set                                                                  |
| RabbitMq__Host                        | RabbitMq host address                              | not set                                                                  |
| RabbitMq__Username                    | RabbitMq user name                                 | not set                                                                  |
| RabbitMq__Password                    | RabbitMq password                                  | not set                                                                  |
| ConnectionStrings__PostgreSql         | PostgreSql connection string                       | not set                                                                  |
| RetryPolicy__Count                    | Retry count (0-no retries)                         | 144                                                                      |
| RetryPolicy__Interval                 | Retry interval (TimeSpan format)                   | 00:10:00                                                                 |
| Sentry__Dsn                           | Sentry Dsn (see: sentry.io)                        | not set                                                                  |
| TonClientNetwork__Endpoints__0        | Use for message decription and sending             | not set (main network entripoints)                                       |
| TonClientNetwork__Endpoints__1        | Set free ton network endpoints                     | not set                                                                  |
| TonClientNetwork__Endpoints__N        | Incriminate number to add another endpoints        | not set                                                                  |
| TonClientNetwork__MessageRetriesCount | The number of automatic message processing retries | not set                                                                  |
| TonClientNetwork__MessageRetriesCount | The number of automatic message processing retries | not set                                                                  |

## Firebase Cloud Messaging configure

See https://firebase.google.com/docs/cloud-messaging?hl=en&authuser=0
Just get keys and config and mount them into the docker container or place in src/Notifon.Server folder See mounting example
in https://github.com/ton-actions/free-ton-http-notification-provider/blob/main/.docker-compose/docker-compose.cluster.yaml

### Keys file

Create and mount file with your keys `firebase-key.json`:

```json
{
    "type": "service_account",
    "project_id": "project_id",
    "private_key_id": "private_key_id",
    "private_key": "-----BEGIN PRIVATE KEY-----\nprivate_key\n-----END PRIVATE KEY-----\n",
    "client_email": "client_email",
    "client_id": "client_id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-wa4xo%40notifon-be3df.iam.gserviceaccount.com"
}
```

### App config file

Create and mount file with your app config and vapidKey `firebase-config.json`:

```json
{
    "config": {
        "apiKey": "AIzaSyBRtA8KuKWMEohjxo9L7ZoTaP3CCRJie_g",
        "authDomain": "notifon-be3df.firebaseapp.com",
        "projectId": "notifon-be3df",
        "storageBucket": "notifon-be3df.appspot.com",
        "messagingSenderId": "858600272109",
        "appId": "1:858600272109:web:8cfe6742ba84116a35dce4",
        "measurementId": "G-QQHHEP62YM"
    },
    "vapidKey": "BBB38sWK51da-UgyaafKaySrJKiu8k_4UPV-2k4vv2roOpg5jjWM7ULxxuFEfA8rY7CVDr-_WHZVCg7b6d4pTlg"
}
```

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

## Application Architectural Diagram

There is an application architectural diagram:

![alt text](https://github.com/ch1seL/free-ton-http-notification-provider/blob/main/docs/Notifon%20Application%20Architectural%20Diagram.drawio.png?raw=true)

---

## TODO

- Grafana Dashboard for Message Queues
- Helm chart for easy Kubernetes deployment
- Plugin architecture for providers
- DeBot interaction from app
