FROM node:19
WORKDIR /

# Copy files
ADD dist ./dist
ADD app ./app
ADD js ./js
ADD .greenlockrc ./
ADD package.json ./
ADD server.js ./

# Create directories
RUN mkdir -p /uploads
RUN mkdir -p /greenlock.d

# RUN npm install
# If you are building your code for production
RUN npm install

# # ENV EMAIL=admin@localhost
ENV DOMAIN=localhost

EXPOSE 443

CMD echo '{ "sites": [{ "subject": "$DOMAIN", "altnames": ["$DOMAIN"] }] }' > ./greenlock.d/config.json && node server.js