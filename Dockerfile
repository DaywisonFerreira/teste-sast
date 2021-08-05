FROM node:14.17.0-alpine

WORKDIR /app

COPY . .

RUN npm i -g pm2

RUN npm i --only=prod

RUN npm run build

RUN npm uninstall typescript

EXPOSE 9490

CMD ["pm2-runtime", "ecosystem.config.js"]
