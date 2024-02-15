# Use an official Node.js runtime as a base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the application source code to the working directory
COPY . .

RUN npm install -g nodemon

# Expose the port on which the app will run
EXPOSE 3500

# Define the command to run your application
CMD ["node", "server.js"]

