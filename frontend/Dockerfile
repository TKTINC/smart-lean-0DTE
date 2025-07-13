# Multi-stage build for lean frontend deployment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Debug: Show what's in the build context
RUN echo "=== Build context contents ===" && ls -la /

# Copy package files with error handling
COPY package.json ./
COPY package-lock.json ./

# Debug: Verify files were copied
RUN echo "=== Files in /app after copy ===" && ls -la /app/

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Debug: Show final structure
RUN echo "=== Final structure ===" && ls -la /app/

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

