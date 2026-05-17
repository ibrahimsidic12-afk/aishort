/**
 * OpenAI client setup
 */

import OpenAI from "openai";
import { AI_DEFAULTS } from "@/lib/constants";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json_object";
  },
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: options?.model ?? AI_DEFAULTS.MODEL,
    temperature: options?.temperature ?? AI_DEFAULTS.TEMPERATURE,
    max_tokens: options?.maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
    response_format: options?.responseFormat
      ? { type: options.responseFormat }
      : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function chatCompletionJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; temperature?: number; maxTokens?: number },
): Promise<T> {
  const raw = await chatCompletion(systemPrompt, userPrompt, {
    ...options,
    responseFormat: "json_object",
  });
  return JSON.parse(raw) as T;
}
