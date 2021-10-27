FROM node:16.12-alpine3.11

WORKDIR /app

COPY .yarn /app/.yarn
COPY src /app/src
COPY .pnp.cjs .yarnrc.yml package.json tsconfig.json yarn.lock /app/

RUN yarn

CMD ["yarn", "start"]