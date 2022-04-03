FROM node:17.4.0-alpine3.15

WORKDIR /app

COPY src /app/src
COPY .yarn /app/.yarn
COPY package.json tsconfig.json yarn.lock /app/

RUN yarn set version berry && yarn

ARG NODE_ENV="production"

ENV NODE_ENV ${NODE_ENV}

CMD ["yarn", "start"]