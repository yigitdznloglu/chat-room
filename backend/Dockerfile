# Use the Node.js 20.15.0 image as a base
FROM node:20.15.0

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3009

# Start the application
CMD ["npm", "start"]
