FROM node:20-alpine AS base

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy worker source
COPY workers/ffmpeg-worker/ ./workers/ffmpeg-worker/
COPY lib/ ./lib/
COPY types/ ./types/
COPY tsconfig.json ./

# Build
RUN npx tsc --outDir dist

CMD ["node", "dist/workers/ffmpeg-worker/worker.js"]
