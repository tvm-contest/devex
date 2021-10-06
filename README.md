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