FROM node:16.12-alpine3.11

WORKDIR /app

COPY . /app/

RUN yarn set version berry && yarn install

# COPY . /app

CMD ["yarn", "start"]