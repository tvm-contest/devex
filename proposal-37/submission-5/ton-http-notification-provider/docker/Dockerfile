FROM golang:alpine
RUN apk add --no-cache supervisor
RUN apk add --update coreutils && rm -rf /var/cache/apk/*
COPY ./build /opt
RUN chmod +x /opt/ton-http-notification-provider
ADD supervisord.conf /etc/supervisord.conf
ADD http-provider.conf /etc/supervisor.d/http-provider.conf
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]