FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS base
WORKDIR /app
EXPOSE 80

FROM scratch AS resore-shared
WORKDIR /src


FROM mcr.microsoft.com/dotnet/sdk:5.0 AS restore
WORKDIR /src
COPY ["Shared/Shared.csproj", "Shared/"]
COPY ["Client/Client.csproj", "Client/"]
COPY ["Server/Server.csproj", "Server/"]
WORKDIR /src/Server
RUN dotnet restore

FROM restore AS build
COPY . /src
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
LABEL org.opencontainers.image.source="https://github.com/ch1seL/free-ton-http-notification-provider"
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Server.dll"]
