/**
 * Shared RAG types kept separate from PDF ingest utilities so the
 * production chat/server bundle does not pull in pdf-parse / pdf2json.
 */

export interface ChunkMetadata {
  filename: string;
  category: string;
  chunkIndex: number;
  totalPages: number;
  /** Source corpus (from folder under pdfs/). */
  origin?: string;
  paperId?: string;
  title?: string;
  authors?: string[];
  year?: number;
  url?: string;
  abstract?: string;
}

export interface Chunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface SearchResult {
  text: string;
  metadata: {
    filename: string;
    category: string;
    chunkIndex: number;
    totalPages: number;
    origin?: string;
    paperId?: string;
    title?: string;
    authors?: string;
    year?: number;
    url?: string;
  };
  score?: number;
}
