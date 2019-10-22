FROM node:8-buster

ENV NODE_ENV=production

# Add deps for tilelive-gl + mapbox-gl-native
RUN apt update && \
    apt install -y \
        libegl1 \
        libgles2 \
        xvfb

# Upgrade npm
RUN npm install -g npm@latest && \
    npm install -g npm-add-dependencies && \
    npm install -g lerna

RUN chown node /opt && \
    git clone --single-branch --branch cutomize_tilejson_var https://github.com/frodrigo/kartotherian.git /opt/kartotherian

WORKDIR /opt/kartotherian/
RUN lerna bootstrap --nohoist mapnik --nohoist libxmljs
RUN lerna add "tilelive-gl@git+https://git@github.com/trailbehind/tilelive-gl.git"

WORKDIR /opt/kartotherian/packages/kartotherian
COPY --chown=node config.yaml .
COPY --chown=node sources.yaml .

CMD rm -fr /tmp/.X1-lock && bash -c "Xvfb :1 &" && sleep 3 && DISPLAY=:1 node server.js -c config.yaml
