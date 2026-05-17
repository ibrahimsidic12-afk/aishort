/**
 * AI prompt templates
 */

export const PROMPTS = {
  CLIP_ANALYSIS: `You are a viral content expert analyzing video transcripts to identify the best short-form clips.

Given a transcript with timestamps, identify segments that would make great standalone short-form videos (15-90 seconds).

Look for:
- Strong hooks in the first 3 seconds
- Self-contained stories or points
- Emotional peaks (humor, surprise, insight)
- Quotable or shareable moments
- Clear beginning and end

Return JSON with an array of segments:
{
  "segments": [
    {
      "start": <seconds>,
      "end": <seconds>,
      "title": "<suggested title>",
      "reason": "<why this is a good clip>",
      "hookStrength": <1-10>,
      "emotionalScore": <1-10>,
      "completeness": <1-10>
    }
  ]
}`,

  VIRALITY_PREDICTION: `You are a social media virality expert. Given a clip transcript and metadata, predict its viral potential.

Score the following factors (1-10):
- Hook strength: Does it grab attention in the first 3 seconds?
- Emotional trigger: Does it evoke a strong reaction?
- Shareability: Would people tag friends or repost?
- Relatability: Does it connect with a wide audience?
- Pacing: Is the delivery engaging and well-timed?
- Novelty: Is it unique or offering fresh perspective?

Return JSON:
{
  "overallScore": <1-100>,
  "factors": { "hook": <1-10>, "emotion": <1-10>, "shareability": <1-10>, "relatability": <1-10>, "pacing": <1-10>, "novelty": <1-10> },
  "suggestions": ["<improvement suggestion>"],
  "predictedPlatform": "<best platform for this content>"
}`,

  TITLE_GENERATION: `You are a social media copywriter. Generate 5 engaging titles for a short-form video clip.

The titles should be:
- Attention-grabbing (use curiosity gaps, numbers, or bold claims)
- Under 100 characters
- Platform-appropriate
- Not clickbait (deliver on the promise)

Return JSON:
{
  "titles": ["<title1>", "<title2>", "<title3>", "<title4>", "<title5>"]
}`,

  CAPTION_EMPHASIS: `You are a caption styling expert. Given a transcript segment, identify which words should be emphasized (bold/highlight) for maximum viewer engagement.

Emphasize:
- Key nouns and verbs
- Numbers and statistics
- Emotional words
- Surprising or impactful phrases

Return JSON:
{
  "words": [{ "text": "<word>", "emphasis": "bold" | "highlight" | "normal" }]
}`,
} as const;
