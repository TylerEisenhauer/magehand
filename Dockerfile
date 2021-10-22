FROM node:14.15.5-alpine3.10

WORKDIR /app

COPY package.json yarn.lock /app/

RUN apk add --no-cache --virtual .gyp \
            python \
            make \
            g++ \
    && yarn install \
    && apk del .gyp

COPY . /app

CMD ["yarn", "start"]