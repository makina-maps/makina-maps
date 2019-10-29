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
    git clone --single-branch --branch makina_maps https://github.com/frodrigo/kartotherian.git /opt/kartotherian

WORKDIR /opt/kartotherian/
RUN lerna bootstrap --nohoist mapnik --nohoist libxmljs
RUN lerna add "tilelive-gl@git+https://git@github.com/trailbehind/tilelive-gl.git"
RUN lerna add "tilelive_kartotherian_cache@git+https://github.com/frodrigo/tilelive_kartotherian_cache.git"
RUN lerna add "kartotherian_gl_style_requestHandlers@git+https://github.com/frodrigo/kartotherian_gl_style_requestHandlers.git"
RUN lerna add "kartotherian_gl@git+https://github.com/frodrigo/kartotherian_gl.git"

WORKDIR /opt/kartotherian/packages/kartotherian
COPY --chown=node config.yaml .
COPY --chown=node sources.yaml .

CMD rm -fr /tmp/.X1-lock && bash -c "Xvfb :1 &" && sleep 3 && DISPLAY=:1 node server.js -c config.yaml
