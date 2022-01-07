# Script from https://gist.github.com/hermanbanken/96f0ff298c162a522ddbba44cad31081

# nginx:alpine contains NGINX_VERSION environment variable, like so:
ARG NGINX_VERSION=1.20.1


# Builder


FROM nginx:${NGINX_VERSION}-alpine AS builder

# Our ngx_cache_purge version
ENV NGX_CACHE_PURGE_VERSION=d1.1_n1.20.0

# Download sources
RUN curl "https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz" -o nginx.tar.gz && \
    curl -L "https://github.com/maa123/ngx_cache_purge/archive/refs/tags/${NGX_CACHE_PURGE_VERSION}.tar.gz" -o ngx_cache_purge.tar.gz

# For latest build deps, see https://github.com/nginxinc/docker-nginx/blob/master/mainline/alpine/Dockerfile
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    libc-dev \
    make \
    openssl-dev \
    pcre-dev \
    zlib-dev \
    linux-headers \
    curl \
    gnupg \
    libxslt-dev \
    gd-dev \
    geoip-dev

# Reuse same cli arguments as the nginx:alpine image used to build
RUN CONFARGS=$(nginx -V 2>&1 | sed -n -e 's/^.*arguments: //p') && \
    CONFARGS=${CONFARGS/-Os -fomit-frame-pointer/-Os} && \
    mkdir /usr/src && \
	tar -zxC /usr/src -f nginx.tar.gz && \
    tar -xzvf "ngx_cache_purge.tar.gz" && \
    DIR="$(pwd)/ngx_cache_purge-${NGX_CACHE_PURGE_VERSION}" && \
    cd /usr/src/nginx-$NGINX_VERSION && \
    sh -c "./configure --with-compat $CONFARGS --add-dynamic-module=$DIR" && \
    make && make install


# NGINX


FROM nginx:${NGINX_VERSION}-alpine
# Extract the dynamic module ngx_cache_purge from the builder image
COPY --from=builder /usr/lib/nginx/modules/ngx_http_cache_purge_module.so /usr/lib/nginx/modules/ngx_http_cache_purge_module.so

#RUN apk update && \
RUN apk --no-cache add \
        bash \
        inotify-tools \
        jq \
        py3-pip \
        python3 && \
    pip install Jinja2

COPY run.sh /
COPY expire.sh /
COPY tile_multiplier.py /

CMD ["/run.sh"]
