# Use the official Node.js image with Chromium dependencies
FROM node:20-slim AS base

# Install Chromium and required libraries
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built assets and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --only=production

# Create avatars directory to avoid runtime errors
RUN mkdir -p avatars

# Expose the API port
EXPOSE 10000

# Start the application
CMD ["node", "dist/index.js"]
