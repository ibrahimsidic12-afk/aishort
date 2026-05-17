# AI Prompts

## Clip Analysis Prompt

Used to identify the best moments in a transcript for short-form content.

**Input**: Full transcript with timestamps
**Output**: Ranked list of segments with scores

## Virality Scoring Prompt

Predicts how likely a clip is to go viral based on:
- Hook strength (first 3 seconds)
- Emotional triggers
- Pacing and delivery
- Topic relevance
- Call-to-action presence

## Title Generation Prompt

Generates engaging titles for clips optimized for each platform.

## Caption Style Prompt

Determines optimal caption timing and emphasis words.

---

See `lib/ai/prompts.ts` for implementation details.
