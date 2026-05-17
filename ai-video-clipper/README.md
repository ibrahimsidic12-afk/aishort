# AI Video Clipper

Turn long-form videos into viral short-form content using AI. Automatically detect the best moments, add captions, and publish to YouTube Shorts, TikTok, and Instagram Reels.

## Features

- **AI Clip Detection** — Identifies the most engaging moments from your videos
- **Auto Captions** — Word-level animated captions in multiple styles
- **Virality Scoring** — Each clip gets a predicted virality score
- **Multi-Platform Publishing** — Direct upload to YouTube, TikTok, Instagram
- **Smart Thumbnails** — AI-selected best frames with overlays
- **Team Collaboration** — Review and approve clips together

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Database | PostgreSQL + Prisma |
| Storage | Cloudflare R2 + Vercel Blob |
| Queue | Upstash QStash + Redis |
| AI | OpenAI (GPT-4 + Whisper) |
| Video | FFmpeg (Docker workers) |
| Billing | Stripe |
| Analytics | PostHog |
| Deployment | Vercel + Docker |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Required API keys (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ai-video-clipper.git
cd ai-video-clipper

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# Set up database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

### Running Workers

Workers handle compute-intensive tasks:

```bash
npm run worker:ffmpeg        # Video processing
npm run worker:ai            # AI analysis
npm run worker:transcription # Audio transcription
npm run worker:thumbnail     # Thumbnail generation
npm run worker:cleanup       # Periodic cleanup
```

Or use Docker Compose:

```bash
docker compose -f docker/compose.yml up
```

## Project Structure

```
ai-video-clipper/
├── app/              # Next.js App Router
│   ├── (auth)/       # Authentication pages
│   ├── (marketing)/  # Public marketing pages
│   ├── (dashboard)/  # Protected dashboard pages
│   ├── api/          # API route handlers
│   └── workflows/    # Business logic workflows
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Shared libraries & services
├── workers/          # Background processing workers
├── types/            # TypeScript type definitions
├── prisma/           # Database schema & migrations
├── docker/           # Docker configurations
├── scripts/          # Utility scripts
├── tests/            # Test files
└── docs/             # Documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Workers](docs/workers.md)
- [AI Prompts](docs/prompts.md)

## License

MIT - see [LICENSE](LICENSE)
