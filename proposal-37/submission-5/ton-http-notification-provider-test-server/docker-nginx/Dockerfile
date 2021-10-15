FROM ubuntu:14.04

MAINTAINER Viktorov Konstantin "e@logvik.com"
ENV DEBIAN_FRONTEND noninteractive

# Update system
RUN apt-get update && apt-get dist-upgrade -y

# Prevent restarts when installing
RUN echo '#!/bin/sh\nexit 101' > /usr/sbin/policy-rc.d && chmod +x /usr/sbin/policy-rc.d
RUN apt-get -y install nginx-extras git curl supervisor
RUN apt-get -y install mailutils
CMD ["/usr/bin/supervisord", "-n"]

### Add configuration files
# Supervisor
ADD ./config/supervisor/supervisord-nginx.conf /etc/supervisor/conf.d/supervisord-nginx.conf

# Nginx
# Just use in compose yml file
# volumes:
#    - ./nginx:/etc/nginx