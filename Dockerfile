FROM ghcr.io/puppeteer/puppeteer:latest as build

USER root

WORKDIR /app

COPY ./package.json ./yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn build

FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg

COPY --from=build /app/dist ./
COPY ./yarn.lock ./yarn.lock

RUN yarn install --production

CMD ["node", "startProcess.js"]
