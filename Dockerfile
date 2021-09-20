FROM node:14.17.0-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm i --only=prod

COPY . .

RUN npm run build

RUN npm uninstall typescript

EXPOSE 3000 8081

CMD ["npm", "run", "serve"]
