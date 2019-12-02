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

RUN git clone --single-branch --branch makina_maps https://github.com/frodrigo/kartotherian.git /opt/kartotherian && echo 2019-11-12-1

WORKDIR /opt/kartotherian/
RUN lerna bootstrap --nohoist mapnik --nohoist libxmljs

COPY modules /opt/modules
RUN lerna add "kartotherian_gl_style_server@/opt/modules/kartotherian_gl_style_server"
RUN lerna add "kartotherian_sources_list_server@/opt/modules/kartotherian_sources_list_server"
RUN lerna add "kartotherian_gl@/opt/modules/kartotherian_gl"
RUN lerna add tilelive-pgquery

WORKDIR /opt/kartotherian/packages/kartotherian
COPY config.yaml .
COPY sources.yaml .

CMD rm -fr /tmp/.X1-lock && bash -c "Xvfb :1 &" && sleep 3 && DISPLAY=:1 node server.js -c config.yaml
