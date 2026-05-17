import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeTranscript(input: { transcript: string }): Promise<unknown> {
  console.warn("[AI] analyzeTranscript: stub");
  return [];
}

export async function scoreSegments(input: Array<{ start: number; end: number; text: string }>): Promise<
  Array<{ start: number; end: number; score: number }>
> {
  console.warn("[AI] scoreSegments: stub");
  return input.map((s) => ({ ...s, score: 0 }));
}

export async function generateCaptions(input: {
  segments: Array<{ start: number; end: number; text: string }>;
}): Promise<unknown[]> {
  console.warn("[AI] generateCaptions: stub");
  return [];
}

export async function selectThumbnail(input: { frames: string[] }): Promise<string> {
  console.warn("[AI] selectThumbnail: stub");
  return input.frames[0] || "";
}

export { openai };
