FROM node:alpine as puppeteer

# prepare
RUN apk add --no-cache \
  chromium \
  ca-certificates \
  ffmpeg

# skip installing chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

FROM puppeteer as build

COPY . /app

RUN yarn install

RUN yarn build

FROM puppeteer

COPY --from=build /app/dist ./
COPY --from=build /app/node_modules ./node_modules

CMD ["node", "startProcess.js"]
