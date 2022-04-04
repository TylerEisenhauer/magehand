FROM node:17.4.0-alpine3.15

WORKDIR /app

RUN apk update && apk add --no-cache tzdata

COPY package.json yarn.lock /app/

RUN yarn install

COPY . /app

ARG NODE_ENV="production"
ARG TZ="America/Chicago"

ENV NODE_ENV ${NODE_ENV}
ENV TZ ${TZ}

CMD ["yarn", "start"]