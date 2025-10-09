# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install Expo CLI globally
RUN npm install -g @expo/cli

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports for Expo
EXPOSE 19000 19001 19002

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Start Expo development server
CMD ["npx", "expo", "start", "--dev-client", "--clear"]