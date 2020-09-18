# FROM nginx

# nginx + module ngx_cache_purge
FROM nullunit/nginx-cache-purge

RUN apk update && \
    apk add \
        bash \
        curl \
        inotify-tools \
        jq \
        python \
        py-jinja2

COPY run.sh /
COPY expire.sh /
COPY tile_multiplier.py /

CMD ["/run.sh"]
