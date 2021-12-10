# Free TON .NET Notification Provider

An application for Free TON event monitoring. Listens to Kafka queue and passes information to a consumer webhook.

## Benefits
- Can be hosted in Azure Functions which brings to you a lot of bonuses like:
  - High availability 
  - Vertical / Horizontal scaling
  - Cheap prices (no need to host whole server)
  - Different distribution channel support like APNS / FCM etc
- Easy deploy using Azure Resource Manager (ARM) templates

## Technology stack
- Azure Table Storage - for information storage
- Polly - to retry failed messages
- Azure Functions (Kafka consumer & Http listeners)

## Development
### Setup local environment
- Create file ```NotificationProvider.Functionslocal.settings.json``` if it doesn't exists
- Put ```AzureTableStorage_ConnectionString``` and ```KAFKA_PASS``` under ```Values``` section, like:
```json
{
  ...
  "Values": {
    ...
    "AzureTableStorage_ConnectionString": "DefaultEndpointsProtocol=https;AccountName=acc;AccountKey=keykey;EndpointSuffix=core.windows.net",
    "KAFKA_PASS": "S0m3str0ngP4sSw0rd"
}
```

### Setup cloud environment (via Visual Studio)
- Open ```NotificationProvider.sln``` in Visual Studio
- Right click on ```AzureResourceGroup``` project -> Deploy ![How to find deploy](https://i.ibb.co/2S636Nr/image.png)
- Fill in necessary information

### Setup cloud environment (via PowerShell)

TBD

## Contacts
[Telegram](https://t.me/giarmul)