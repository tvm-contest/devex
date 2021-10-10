# Development

## Application architectural diagram~~~~

![alt text](https://github.com/ch1seL/free-ton-http-notification-provider/blob/main/docs/Notifon%20Application%20Architectural%20Diagram.drawio.png?raw=true)

## EF Core Migrations~~~~

### Add migration:

```shell
dotnet ef -p .\src\Notifon.Server.Database\ -s .\src\Notifon.Server\ migrations add MIGRATION_NAME
```

### Remove last migration:

```shell
dotnet ef -p .\src\Notifon.Server.Database\ -s .\src\Notifon.Server\ migrations remove
```
