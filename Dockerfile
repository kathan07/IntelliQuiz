# Use an official Node runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Install Babel CLI globally
RUN npm install -g @babel/core @babel/node @babel/preset-env

# Copy app source code
COPY . .

# Expose port 3000 for the app
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]