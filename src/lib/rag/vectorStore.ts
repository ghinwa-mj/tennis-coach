import { ChromaClient, CloudClient } from 'chromadb';
import { Chunk } from '@/utilities/pdfProcessor';
import {
  embedDocuments,
  embedQuery,
  OPENROUTER_EMBEDDING_MODEL,
} from '@/lib/rag/openrouterEmbeddings';

function compactMetadata(meta: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return out;
}

export interface SearchResult {
  text: string;
  metadata: {
    filename: string;
    category: string;
    chunkIndex: number;
    totalPages: number;
    origin?: string;
    // Citation metadata
    paperId?: string;
    title?: string;
    authors?: string;
    year?: number;
    url?: string;
  };
  score?: number;
}

export class VectorStore {
  private client: ChromaClient | CloudClient;
  private collection: any = null;
  private readonly COLLECTION_NAME = 'tennis_coaching';

  constructor() {
    // Check if using ChromaDB Cloud
    const useCloud = process.env.CHROMADB_CLOUD === 'true';

    if (useCloud && process.env.CHROMADB_API_KEY) {
      // Use ChromaDB Cloud
      console.log('Connecting to ChromaDB Cloud...');
      this.client = new CloudClient({
        apiKey: process.env.CHROMADB_API_KEY,
        tenant: process.env.CHROMADB_TENANT,
        database: process.env.CHROMADB_DATABASE || 'tennis-coach',
      });
    } else {
      // Use local ChromaDB
      console.log('Connecting to local ChromaDB...');
      this.client = new ChromaClient({
        path: process.env.CHROMADB_URL || 'http://localhost:8000',
      });
    }
  }

  /**
   * Initialize or get the collection
   */
  async initialize(): Promise<void> {
    try {
      // Try to get existing collection
      this.collection = await this.client.getCollection({
        name: this.COLLECTION_NAME,
      });
      console.log(`✅ Connected to existing collection: ${this.COLLECTION_NAME}`);
    } catch (error) {
      // Collection doesn't exist, create it
      console.log(`Creating new collection: ${this.COLLECTION_NAME}`);
      this.collection = await this.client.createCollection({
        name: this.COLLECTION_NAME,
        metadata: { description: 'Tennis coaching literature with full metadata' },
      });
    }
  }

  /**
   * Add chunks to the collection
   */
  async addChunks(chunks: Chunk[]): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    if (!this.collection || chunks.length === 0) {
      throw new Error('Cannot add chunks: collection not initialized or no chunks provided');
    }

    console.log(
      `Adding ${chunks.length} chunks with OpenRouter embeddings (${OPENROUTER_EMBEDDING_MODEL})...`
    );

    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const ids = batch.map((chunk) => {
        const safeFile = chunk.metadata.filename.replace(/[/\\]/g, '__');
        return `${safeFile}_${chunk.metadata.chunkIndex}`;
      });
      const documents = batch.map((chunk) => chunk.text);
      const embeddings = await embedDocuments(documents);
      if (i === 0 && embeddings[0]?.length) {
        console.log(`  (embedding dim: ${embeddings[0].length}, model ${OPENROUTER_EMBEDDING_MODEL})`);
      }

      const metadatas = batch.map((chunk) =>
        compactMetadata({
          filename: chunk.metadata.filename,
          category: chunk.metadata.category,
          chunkIndex: chunk.metadata.chunkIndex,
          totalPages: chunk.metadata.totalPages,
          origin: chunk.metadata.origin,
          paperId: chunk.metadata.paperId,
          title: chunk.metadata.title,
          authors: chunk.metadata.authors?.join(', '),
          year: chunk.metadata.year,
          url: chunk.metadata.url,
        })
      );

      await this.collection.add({
        ids,
        documents,
        embeddings,
        metadatas,
      });

      console.log(`  → Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }

    console.log('✅ Successfully added all chunks to vector store');
  }

  /**
   * Search for relevant chunks based on a query
   */
  async search(query: string, nResults: number = 5): Promise<SearchResult[]> {
    if (!this.collection) {
      await this.initialize();
    }

    if (!this.collection) {
      throw new Error('Collection not initialized');
    }

    const queryVector = await embedQuery(query);

    const results = await this.collection.query({
      queryEmbeddings: [queryVector],
      nResults,
    });

    if (!results.documents[0] || !results.metadatas[0]) {
      return [];
    }

    const searchResults: SearchResult[] = results.documents[0].map((doc: string, idx: number) => ({
      text: doc,
      metadata: results.metadatas![0][idx] as any,
      score: results.distances?.[0]?.[idx],
    }));

    return searchResults;
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{ count: number } | null> {
    if (!this.collection) {
      await this.initialize();
    }

    if (!this.collection) {
      return null;
    }

    const count = await this.collection.count();
    return { count };
  }

  /**
   * Clear all data from the collection
   */
  async clear(): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    if (!this.collection) {
      return;
    }

    await this.client.deleteCollection({ name: this.COLLECTION_NAME });
    this.collection = null;
    await this.initialize();
    console.log('✅ Collection cleared');
  }
}

// Singleton instance
let vectorStoreInstance: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}
