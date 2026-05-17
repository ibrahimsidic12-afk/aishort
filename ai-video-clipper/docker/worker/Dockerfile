FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY workers/ ./workers/
COPY lib/ ./lib/
COPY types/ ./types/
COPY tsconfig.json ./

# Default: AI worker. Override with docker run command
CMD ["npx", "tsx", "workers/ai-worker/worker.ts"]
