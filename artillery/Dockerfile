FROM node:8-buster

ENV NODE_ENV=production

RUN apt update && \
    apt install -y \
        ruby

RUN npm install --global --unsafe-perm artillery artillery-plugin-publish-metrics

COPY . /artillery
WORKDIR /artillery

CMD /bin/bash
