FROM node:18-alpine
WORKDIR /usr/src/app

COPY package.json .

RUN npm i --force
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

COPY . .

COPY docker.env .env

RUN npm run build

EXPOSE 3000

CMD [ "node", "dist/src/main.js" ]