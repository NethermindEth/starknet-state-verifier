FROM node:16 as base
WORKDIR /app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn --production=false
COPY . .

FROM base as dev
ENV NODE_ENV = dev
CMD ["yarn","dev"]
