FROM ghcr.io/puppeteer/puppeteer:latest as build

USER root

WORKDIR /app

COPY ./package.json ./yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn build

RUN npm prune --omit=dev

FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg stockfish && rm -rf /var/lib/{apt,dpkg,cache,log}/

COPY --from=build /app/dist ./
COPY --from=build /app/node_modules ./node_modules
COPY ./yarn.lock ./yarn.lock

VOLUME ["/app/data"]

CMD ["node", "startProcess.js"]
