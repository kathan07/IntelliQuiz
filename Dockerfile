# Use an official Node.js image as the base image
FROM node:14

# Install Redis
RUN apt-get update && apt-get install -y redis-server

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Create a startup script that runs Redis and the app
RUN echo "#!/bin/bash\nservice redis-server start\nnpx nodemon --exec babel-node server/index.js" > /usr/src/app/start.sh
RUN chmod +x /usr/src/app/start.sh

# Set the startup script as the entrypoint
ENTRYPOINT ["/usr/src/app/start.sh"]
