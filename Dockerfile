FROM node:17.4.0-alpine3.15

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install

COPY . /app

ARG NODE_ENV="production"

ENV NODE_ENV ${NODE_ENV}

CMD ["yarn", "start"]