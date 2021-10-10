FROM mcr.microsoft.com/dotnet/sdk:5.0 AS sdk
WORKDIR /src

FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Development
#connect sql lite db as volume
VOLUME /app/App_Data    
EXPOSE 80

FROM scratch AS csproj-client
COPY ["src/Directory.Build.props", "/src/Directory.Build.props"]
COPY ["src/Notifon.Client/Notifon.Client.csproj", "/src/Notifon.Client/Notifon.Client.csproj"]
COPY ["src/Notifon.Client.Storage/Notifon.Client.Storage.csproj", "/src/Notifon.Client.Storage/Notifon.Client.Storage.csproj"]
COPY ["src/Notifon.Common/Notifon.Common.csproj", "/src/Notifon.Common/Notifon.Common.csproj"]

FROM scratch AS csproj-server
COPY ["src/Directory.Build.props", "/src/Directory.Build.props"]
COPY ["src/Notifon.Server/Notifon.Server.csproj", "/src/Notifon.Server/Notifon.Server.csproj"]
COPY ["src/Notifon.Server.Business/Notifon.Server.Business.csproj", "/src/Notifon.Server.Business/Notifon.Server.Business.csproj"]
COPY ["src/Notifon.Server.Configuration/Notifon.Server.Configuration.csproj", "/src/Notifon.Server.Configuration/Notifon.Server.Configuration.csproj"]
COPY ["src/Notifon.Server.Database/Notifon.Server.Database.csproj", "/src/Notifon.Server.Database/Notifon.Server.Database.csproj"]
COPY ["src/Notifon.Server.Kafka/Notifon.Server.Kafka.csproj", "/src/Notifon.Server.Kafka/Notifon.Server.Kafka.csproj"]
COPY ["src/Notifon.Server.MassTransit/Notifon.Server.MassTransit.csproj", "/src/Notifon.Server.MassTransit/Notifon.Server.MassTransit.csproj"]
COPY ["src/Notifon.Server.Models/Notifon.Server.Models.csproj", "/src/Notifon.Server.Models/Notifon.Server.Models.csproj"]
COPY ["src/Notifon.Server.Redis/Notifon.Server.Redis.csproj", "/src/Notifon.Server.Redis/Notifon.Server.Redis.csproj"]
COPY ["src/Notifon.Server.SignalR/Notifon.Server.SignalR.csproj", "/src/Notifon.Server.SignalR/Notifon.Server.SignalR.csproj"]
COPY ["src/Notifon.Server.Utils/Notifon.Server.Utils.csproj", "/src/Notifon.Server.Utils/Notifon.Server.Utils.csproj"]
COPY ["src/Notifon.Common/Notifon.Common.csproj", "/src/Notifon.Common/Notifon.Common.csproj"]

FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build-client
WORKDIR /src
COPY --from=csproj-client / /
RUN dotnet restore Notifon.Client
COPY src/Notifon.Client Notifon.Client
COPY src/Notifon.Client.Storage Notifon.Client.Storage
COPY src/Notifon.Common Notifon.Common
RUN dotnet build -c Release Notifon.Client
RUN dotnet publish -c Release --no-build -o /publish Notifon.Client

FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build-server
WORKDIR /src
COPY --from=csproj-server / /
RUN dotnet restore Notifon.Server
COPY src/Notifon.Server Notifon.Server
COPY src/Notifon.Server.Business Notifon.Server.Business
COPY src/Notifon.Server.Database Notifon.Server.Database
COPY src/Notifon.Server.Configuration Notifon.Server.Configuration
COPY src/Notifon.Server.Kafka Notifon.Server.Kafka
COPY src/Notifon.Server.MassTransit Notifon.Server.MassTransit
COPY src/Notifon.Server.Models Notifon.Server.Models
COPY src/Notifon.Server.Redis Notifon.Server.Redis
COPY src/Notifon.Server.SignalR Notifon.Server.SignalR
COPY src/Notifon.Server.Utils Notifon.Server.Utils
COPY src/Notifon.Common Notifon.Common
RUN dotnet build -c Release Notifon.Server
RUN dotnet publish -c Release --no-build -o /publish Notifon.Server

FROM runtime AS final
LABEL org.opencontainers.image.source = "https://github.com/ch1seL/free-ton-http-notification-provider"
WORKDIR /app
COPY --from=build-client /publish .
COPY --from=build-server /publish .
ENTRYPOINT ["dotnet", "Notifon.Server.dll"]
