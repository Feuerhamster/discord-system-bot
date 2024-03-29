FROM node:16.16-alpine AS build

WORKDIR /tmp/

# install dependencies
COPY ["package.json", "package-lock.json*", "tsconfig.json", "./"]
RUN npm install

# copy source files
COPY src/ ./src/

# build
RUN npm run build

FROM node:16.16-alpine

WORKDIR /app/

COPY --from=build ["tmp/package.json", "tmp/package-lock.json*", "./"]

ENV NODE_ENV=production

# install prod dependencies
RUN npm install

COPY --from=build tmp/dist/ ./dist/

# run once, to create config file
RUN npm start; exit 0

CMD ["npm", "start"]
