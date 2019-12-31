FROM xdrum/nginx-extras

RUN apt update && \
    apt install -y \
        curl \
        inotify-tools \
        jq

COPY run.sh /
COPY expire.sh /

CMD ["/run.sh"]
