FROM node:16.12-alpine3.11

WORKDIR /app

COPY src /app/src
COPY package.json tsconfig.json yarn.lock /app/

RUN yarn set version berry && yarn

CMD ["yarn", "start"]