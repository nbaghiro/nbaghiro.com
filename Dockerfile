# Multi-stage build for production

# Stage 1: Build client
FROM node:22-alpine AS client-builder
WORKDIR /app

# Copy workspace configuration
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies (workspaces)
RUN npm ci

# Copy client source
COPY client/ ./client/

# Build client
WORKDIR /app/client
RUN npm run build

# Stage 2: Setup server
FROM node:22-alpine AS server-builder
WORKDIR /app

# Copy workspace configuration
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install production dependencies only
RUN npm ci --omit=dev

# Stage 3: Production image
FROM node:22-alpine
WORKDIR /app

# Copy workspace structure and dependencies
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/client/package.json ./client/package.json
COPY server/src ./server/src

# Copy built client files
COPY --from=client-builder /app/client/dist ./client/dist

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Start server
CMD ["node", "server/src/server.js"]
