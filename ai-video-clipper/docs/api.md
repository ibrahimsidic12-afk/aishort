# API Reference

## Authentication

All API routes (except `/api/health` and webhooks) require authentication via Clerk session.

## Endpoints

### Upload

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload/presigned` | Get presigned upload URL |
| POST | `/api/upload/complete` | Complete upload, trigger processing |
| POST | `/api/upload/multipart` | Multipart upload operations |

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jobs/create` | Create a processing job |
| POST | `/api/jobs/retry` | Retry a failed job |
| POST | `/api/jobs/cancel` | Cancel a job |
| GET | `/api/jobs/status` | Get job status |

### Clips

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/clips/generate` | Generate clips for a video |
| POST | `/api/clips/regenerate` | Regenerate with new params |
| POST | `/api/clips/publish` | Publish clip to platform |
| GET/PUT | `/api/clips/captions` | Get/update captions |
| DELETE | `/api/clips/delete` | Delete a clip |

### Publishing

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/youtube/upload` | Upload to YouTube |
| POST | `/api/youtube/publish` | Publish on YouTube |
| POST | `/api/tiktok/publish` | Publish on TikTok |

### Billing

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/stripe/checkout` | Create checkout session |
| POST | `/api/stripe/portal` | Open billing portal |

### Other

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics` | Get analytics data |
| GET | `/api/health` | Health check |
