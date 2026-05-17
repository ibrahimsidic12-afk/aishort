FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY workers/ffmpeg-worker/ ./workers/ffmpeg-worker/
COPY lib/ ./lib/
COPY types/ ./types/
COPY tsconfig.json ./

CMD ["npx", "tsx", "workers/ffmpeg-worker/worker.ts"]
