# FROM nginx

# nginx + module ngx_cache_purge
FROM nullunit/nginx-cache-purge

RUN apk update && \
    apk add \
        bash \
        curl \
        inotify-tools \
        jq

COPY run.sh /
COPY expire.sh /

CMD ["/run.sh"]
