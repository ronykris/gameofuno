# Use an official Node runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the .env file
COPY .env .

# Install dotenv package to load environment variables
RUN npm install dotenv --save

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
CMD ["node", "index.js"]
