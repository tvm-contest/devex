FROM mcr.microsoft.com/dotnet/sdk:5.0 AS sdk
WORKDIR /src

FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS runtime
WORKDIR /app
EXPOSE 80

FROM scratch AS csproj-client
COPY ["src/Client/Client.csproj", "/src/Client/Client.csproj"]
COPY ["src/Client.Storage/Client.Storage.csproj", "/src/Client.Storage/Client.Storage.csproj"]
COPY ["src/Common/Common.csproj", "/src/Common/Common.csproj"]

FROM scratch AS csproj-server
COPY ["src/Server/Server.csproj", "/src/Server/Server.csproj"]
COPY ["src/Server.Business/Server.Business.csproj", "/src/Server.Business/Server.Business.csproj"]
COPY ["src/Server.Configuration/Server.Configuration.csproj", "/src/Server.Configuration/Server.Configuration.csproj"]
COPY ["src/Server.Database/Server.Database.csproj", "/src/Server.Database/Server.Database.csproj"]
COPY ["src/Server.Kafka/Server.Kafka.csproj", "/src/Server.Kafka/Server.Kafka.csproj"]
COPY ["src/Server.MassTransit/Server.MassTransit.csproj", "/src/Server.MassTransit/Server.MassTransit.csproj"]
COPY ["src/Server.Redis/Server.Redis.csproj", "/src/Server.Redis/Server.Redis.csproj"]
COPY ["src/Server.SignalR/Server.SignalR.csproj", "/src/Server.SignalR/Server.SignalR.csproj"]
COPY ["src/Server.Utils/Server.Utils.csproj", "/src/Server.Utils/Server.Utils.csproj"]
COPY ["src/Common/Common.csproj", "/src/Common/Common.csproj"]

FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build-client
WORKDIR /src
COPY --from=csproj-client / /
RUN dotnet restore Client
COPY src/Client Client
COPY src/Client.Storage Client.Storage
COPY src/Common Common
RUN dotnet build -c Release Client
RUN dotnet publish -c Release --no-build -o /publish Client

FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build-server
WORKDIR /src
COPY --from=csproj-server / /
RUN dotnet restore Server
COPY src/Server Server
COPY src/Server.Business Server.Business
COPY src/Server.Database Server.Database
COPY src/Server.Configuration Server.Configuration
COPY src/Server.Kafka Server.Kafka
COPY src/Server.MassTransit Server.MassTransit
COPY src/Server.Redis Server.Redis
COPY src/Server.SignalR Server.SignalR
COPY src/Server.Utils Server.Utils
COPY src/Common Common
RUN dotnet build -c Release Server
RUN dotnet publish -c Release --no-build -o /publish Server

FROM runtime AS final
LABEL org.opencontainers.image.source = "https://github.com/ch1seL/free-ton-http-notification-provider"
WORKDIR /app
COPY --from=build-client /publish .
COPY --from=build-server /publish .
ENTRYPOINT ["dotnet", "Server.dll"]
