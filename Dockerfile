FROM ghcr.io/puppeteer/puppeteer:latest as build

USER root

COPY . /app

WORKDIR /app

RUN yarn install

RUN yarn build

FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /app

COPY --from=build /app/dist ./
COPY ./yarn.lock ./yarn.lock

RUN yarn install --production

CMD ["node", "startProcess.js"]
