# syntax=docker/dockerfile:1

FROM node:14.16.1
LABEL org.opencontainers.image.source=https://github.com/nrukavkov/freeton-notification-service
ENV NODE_ENV=production

WORKDIR /app
RUN mkdir -p /app/databases

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

EXPOSE 8000

CMD [ "node", "server.js" ]