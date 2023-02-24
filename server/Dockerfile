FROM node:19
WORKDIR /app

# Copy files
COPY package.json ./
COPY server.js ./
COPY index.js ./
COPY js ./
COPY dashboard/src/dist /app/dashboard/dist
COPY .greenlockrc ./

RUN mkdir -p /app/uploads
RUN mkdir -p /app/greenlock.d

# RUN npm install
# If you are building your code for production
RUN npm install

# ENV EMAIL=admin@localhost
ENV DOMAIN=localhost

# Bundle app source
COPY . ./app

RUN npx greenlock add --subject ${DOMAIN} --altnames ${DOMAIN}

EXPOSE 443

CMD [ "node", "server.js" ]