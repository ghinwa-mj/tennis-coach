/**
 * OpenRouter OpenAI-compatible embeddings API.
 * @see https://openrouter.ai/docs/api-reference/embeddings
 */

export const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';
export const OPENROUTER_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/** Max texts per request (stay under provider limits). */
const BATCH_SIZE = 64;

interface OpenRouterEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  model?: string;
  error?: { message: string };
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add it to tennis-coach-ai/.env.local (do not commit apikeys.py).'
    );
  }
  return key;
}

/**
 * Embed many document chunks (order preserved).
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = getApiKey();
  const out: number[][] = [];

  for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
    const slice = texts.slice(offset, offset + BATCH_SIZE);
    const res = await fetch(OPENROUTER_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_EMBEDDING_MODEL,
        input: slice,
        encoding_format: 'float',
      }),
    });

    const json = (await res.json()) as OpenRouterEmbeddingResponse;

    if (!res.ok) {
      const msg = json.error?.message ?? res.statusText;
      throw new Error(`OpenRouter embeddings failed (${res.status}): ${msg}`);
    }

    if (!json.data?.length) {
      throw new Error('OpenRouter embeddings: empty data[] in response');
    }

    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    for (const row of sorted) {
      out.push(row.embedding);
    }
  }

  return out;
}

/**
 * Embed a single query string (same model as ingest).
 */
export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedDocuments([text]);
  return vec;
}
