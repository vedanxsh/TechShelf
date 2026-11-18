# Multi-stage / Production-ready Node.js Dockerfile for QuickBite
FROM node:20-alpine AS base

# Install curl/wget for healthchecks
RUN apk add --no-cache curl wget

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy application source code
COPY . .

# Set permissions for non-root node user
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose default HTTP port
EXPOSE 3000

# Environment Defaults
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Docker Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
