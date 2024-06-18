# Use an official node image as the base image
FROM node:16

# Set the working directory
WORKDIR /backend

# Copy package.json and package-lock.json
COPY ../package*.json ./backend/

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the server runs on
EXPOSE 5001

# Start the server
CMD ["node", "server.js"]
