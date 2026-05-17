# Workers

## Overview

Workers handle compute-intensive tasks outside the main application:

## FFmpeg Worker

Handles video processing:
- Clip extraction (trimming)
- Caption overlay rendering
- Platform-specific resizing
- Audio normalization

## AI Worker

Handles AI analysis:
- Transcript analysis for clip detection
- Scoring and ranking segments
- Virality prediction
- Content segmentation

## Transcription Worker

Handles audio transcription:
- Audio extraction from video
- Sending to transcription APIs (Whisper/Deepgram/AssemblyAI)
- Speaker diarization
- Subtitle generation

## Thumbnail Worker

Handles thumbnail generation:
- Frame extraction at key moments
- AI-based best frame selection

## Cleanup Worker

Handles maintenance:
- Deleting temporary files
- Cancelling stale jobs
- Storage cleanup

## Running Workers Locally

```bash
npm run worker:ffmpeg
npm run worker:ai
npm run worker:transcription
npm run worker:thumbnail
npm run worker:cleanup
```
