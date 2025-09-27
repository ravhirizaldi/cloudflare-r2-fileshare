# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Set build-time environment variables
ARG VITE_APP_TITLE="R2 File Share"
ARG VITE_API_BASE_URL="https://file-gateway.it-dev-635.workers.dev"
ARG VITE_API_TIMEOUT="3000000"
ARG VITE_MAX_FILE_SIZE="100000000"
ARG VITE_ALLOWED_FILE_TYPES="*"

ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV VITE_MAX_FILE_SIZE=$VITE_MAX_FILE_SIZE
ENV VITE_ALLOWED_FILE_TYPES=$VITE_ALLOWED_FILE_TYPES

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
