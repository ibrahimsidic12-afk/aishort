/**
 * Text embeddings for similarity
 */

import { openai } from "./client";
import { AI_DEFAULTS } from "@/lib/constants";

/**
 * Generate embeddings for a text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: AI_DEFAULTS.EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: AI_DEFAULTS.EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must have same length");

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Find the most similar texts to a query
 */
export async function findSimilar(
  query: string,
  candidates: string[],
  topK = 5,
): Promise<Array<{ text: string; score: number; index: number }>> {
  const [queryEmbedding, candidateEmbeddings] = await Promise.all([
    getEmbedding(query),
    getEmbeddings(candidates),
  ]);

  const scored = candidates.map((text, index) => ({
    text,
    score: cosineSimilarity(queryEmbedding, candidateEmbeddings[index]),
    index,
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Deduplicate similar segments
 */
export async function deduplicateSegments(
  segments: Array<{ text: string; start: number; end: number }>,
  threshold = 0.9,
): Promise<Array<{ text: string; start: number; end: number }>> {
  if (segments.length <= 1) return segments;

  const embeddings = await getEmbeddings(segments.map((s) => s.text));
  const keep: boolean[] = new Array(segments.length).fill(true);

  for (let i = 0; i < segments.length; i++) {
    if (!keep[i]) continue;
    for (let j = i + 1; j < segments.length; j++) {
      if (!keep[j]) continue;
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      if (similarity > threshold) {
        keep[j] = false; // Remove duplicate
      }
    }
  }

  return segments.filter((_, i) => keep[i]);
}
