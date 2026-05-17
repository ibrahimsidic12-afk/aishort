import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function scoreSegments(input: Array<{ start: number; end: number; score?: number }>): Promise<
  Array<{ start: number; end: number; score: number }>
> {
  console.warn("[AI] scoreSegments: stub");
  return input.map((s) => ({ start: s.start, end: s.end, score: s.score ?? 0 }));
}

export async function detectViralMoments(input: { transcript: string }): Promise<Array<{ start: number; end: number }>> {
  console.warn("[AI] detectViralMoments: stub");
  return [];
}
