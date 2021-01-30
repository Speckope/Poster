FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ["package.json", "yarn.lock*", "./"]

# If our package.json or yarn.lock doesn't change it wont be run 
RUN yarn

# Bundle app source
COPY . .
# This will copy .env and and rename it to .env. Dokku doesn't copy .env
COPY .env.production .env

# This will generate the dist folder
RUN yarn build

ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
USER node