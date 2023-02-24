FROM node:19-alpine
WORKDIR /

# Copy files
ADD dist ./dist
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

EXPOSE 80 443

CMD ["node", "server.js"]