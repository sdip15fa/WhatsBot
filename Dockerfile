FROM ghcr.io/puppeteer/puppeteer:latest as build

USER root

WORKDIR /app

COPY ./package.json ./yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn build

RUN yarn install --production

FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/{apt,dpkg,cache,log}/

COPY --from=build /app/dist ./
COPY ./yarn.lock ./yarn.lock

RUN yarn install --production

VOLUME ["/app/data"]

CMD ["node", "startProcess.js"]
