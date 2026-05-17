# Deployment Guide

## Prerequisites

- Vercel account
- PostgreSQL database (Neon recommended)
- Cloudflare R2 bucket
- Upstash Redis + QStash
- Clerk account
- Stripe account
- OpenAI API key

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in all required values
3. Run `npx prisma db push` to create tables

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Worker Deployment (Docker)

Workers run separately from the main application:

```bash
# Build FFmpeg worker
docker build -f docker/ffmpeg/Dockerfile -t clipper-ffmpeg .

# Run with environment variables
docker run --env-file .env clipper-ffmpeg
```

## Database Migrations

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

## Monitoring

- Application: Vercel Analytics
- Users: PostHog
- Errors: Vercel Logs
- Jobs: QStash Dashboard
