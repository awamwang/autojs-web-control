FROM node:14 as base
ENV GIT_REPO=https://github.com/awamwang/autojs-web-control.git \
  PROJECT_NAME=autojs-web-control

# install
FROM base as deps
WORKDIR /tmp
ADD ./server/package.json ./server/package-lock.json ./server_deps/
ADD ./server/lib/ ./server_deps/lib/
ADD ./web/package.json ./web/package-lock.json ./web_deps/
RUN npm set progress=false
RUN cd /tmp/server_deps && npm install --only=production --registry=https://registry.npmmirror.com && cd /tmp/web_deps && npm install --only=production --registry=https://registry.npmmirror.com
# RUN cp -R /tmp/server_deps prod_server_deps && cp -R /tmp/web_deps prod_web_deps
RUN cd /tmp/server_deps && npm install --registry=https://registry.npmmirror.com && cd /tmp/web_deps && npm install --registry=https://registry.npmmirror.com
# RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

FROM deps as build
# RUN git clone ${GIT_REPO} ${PROJECT_NAME}
COPY . /app/${PROJECT_NAME}/
WORKDIR /app/${PROJECT_NAME}
RUN cd ./server \
  && cp -ar /tmp/server_deps/node_modules/ ./ \
  && npm run build
RUN cd ./web \
  && cp -ar /tmp/web_deps/node_modules/ ./ \
  && npm run build

# app
FROM build
ENV DB_HOST=localhost \
  DB_PORT=3306 \
  DB_USER=root \
  DB_PASSWORD=123321 \
  DB_NAME=cloud_auto \
  DB_DEBUG=false \
  SERVER_LOG_LEVEL=DEBUG \
  SERVER_SECRET=xxx&T1G*sd3 \
  SERVER_EXPIRES_HOUR=6 \
  SERVER_SCRIPT_DIR=./scripts \
  CHOKIDAR_USEPOLLING=1 \
  SERVER_SCRIPT_POLLING_INTERVAL=10000 \
  VSCODE_EXT_PROXY_ON=true \
  VSCODE_EXT_IP=localhost \
  VSCODE_EXT_PORT=9317 \
  VSCODE_EXT_SAVE_ON_RUN=1 \
  WEB_PORT=9528 \
  WEB_BASE_API=http://47.108.180.116:9319 \
  WEB_WS_HOST=ws://47.108.180.116:9319 \
WORKDIR /app/${PROJECT_NAME}
COPY docker/docker-entrypoint.sh /app/${PROJECT_NAME}
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]
# ENTRYPOINT ["echo", "Hello user"]
EXPOSE 9319
EXPOSE 9528
CMD [ "--server", "--web" ]

# docker build -t autojs-web-control -f docker/Dockerfile .