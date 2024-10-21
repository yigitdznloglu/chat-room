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

# Build the React application
RUN npm run build

# Install serve to serve the build folder
RUN npm install -g serve

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build"]
