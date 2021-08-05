FROM node:14.17.0-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY .npmrc ./

RUN npm i --only=prod

RUN npm run build

RUN npm uninstall typescript

EXPOSE 3000

COPY . .

CMD ["npm", "run", "serve"]
