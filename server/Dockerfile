# Use official Node.js image as base
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE ${PORT:-3000}

# Start server
CMD ["npm", "start"]