# Multi-stage build for lean frontend deployment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies with legacy peer deps for compatibility
# Use npm install instead of npm ci to handle version conflicts
RUN npm install --legacy-peer-deps --only=production

# Copy source code
COPY . .

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

