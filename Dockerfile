FROM ghcr.io/puppeteer/puppeteer:latest as build

ENV PUPPETEER_SKIP_DOWNLOAD true

USER root

WORKDIR /app

COPY ./package.json ./yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn build

FROM ghcr.io/puppeteer/puppeteer:latest

ENV PUPPETEER_SKIP_DOWNLOAD true

WORKDIR /app

USER root

RUN apt-get update && apt-get install -y ffmpeg stockfish chromium && rm -rf /var/lib/{apt,dpkg,cache,log}/

COPY ./package.json ./yarn.lock ./
RUN yarn install --production

COPY --from=build /app/dist ./

VOLUME ["/app/data"]

CMD ["node", "startProcess.js"]
