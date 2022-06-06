FROM node:14.19-alpine as build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM node:14.19-alpine

ENV NODE_ENV production

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY --from=build /app/package.json /app/package-lock.json /app/.env /app/.npmrc ./

RUN npm ci --production --ignore-scripts

RUN rm -rf /app/.npmrc

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
