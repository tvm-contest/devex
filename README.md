# Free TON .NET Notification Provider
This repository contains an application which monitors Free TON kafka queue and passes this information to a consumer webhook

# Development
## Setup local environment
- Create file ```NotificationProvider.Functions\local.settings.json``` if it doesn't exists
- Put ```AzureTableStorage_ConnectionString``` and ```KAFKA_PASS``` under ```Values``` section, like:
```json
{
    ...
    "Values": {
        ...
        "AzureTableStorage_ConnectionString": "DefaultEndpointsProtocol=https;AccountName=acc;AccountKey=keykey;EndpointSuffix=core.windows.net",
        "KAFKA_PASS": "S0m3str0ngP4sSw0rd"
}
```

## Setup cloud environment (via Visual Studio)
- Open ```NotificationProvider.sln``` in Visual Studio
- Right click on ```AzureResourceGroup``` project -> Deploy ![How to find deploy](https://i.ibb.co/2S636Nr/image.png)
- Fill in necessary information

## Setup cloud environment (via PowerShell)
TBD