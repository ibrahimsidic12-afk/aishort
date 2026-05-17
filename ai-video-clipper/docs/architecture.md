# Architecture

## Overview

AI Video Clipper is a Next.js 14 application that uses AI to identify, extract, and publish short-form video clips from long-form content.

## Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Auth**: Clerk
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Cloudflare R2 (videos), Vercel Blob (assets)
- **Queue**: Upstash QStash + Redis
- **AI**: OpenAI GPT-4 + Whisper
- **Video Processing**: FFmpeg (Docker workers)
- **Billing**: Stripe (subscriptions + credits)
- **Analytics**: PostHog
- **Deployment**: Vercel (app) + Docker (workers)

## Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  Next.js App │────▶│  PostgreSQL  │
│  (Browser)  │◀────│   (Vercel)   │◀────│   (Neon)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┼──────┐
                    ▼      ▼      ▼
              ┌─────────┐ ┌───┐ ┌──────────┐
              │   R2    │ │AI │ │  QStash   │
              │ Storage │ │   │ │  (Queue)  │
              └─────────┘ └───┘ └──────────┘
                                      │
                              ┌───────┼───────┐
                              ▼       ▼       ▼
                        ┌─────────┐┌──────┐┌─────────┐
                        │ FFmpeg  ││  AI  ││Transcr. │
                        │ Worker  ││Worker││ Worker  │
                        └─────────┘└──────┘└─────────┘
```

## Data Flow

1. User uploads video → R2 storage
2. QStash enqueues transcription job
3. Transcription worker processes audio
4. AI worker analyzes transcript for best clips
5. FFmpeg worker renders clips with captions
6. User reviews and publishes to platforms
