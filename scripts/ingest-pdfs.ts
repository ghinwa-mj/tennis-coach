#!/usr/bin/env tsx

import path from 'path';
import { config } from 'dotenv';
import { PDFProcessor } from '../src/utilities/pdfProcessor';
import { getVectorStore } from '../src/lib/rag/vectorStore';
import { OPENROUTER_EMBEDDING_MODEL } from '../src/lib/rag/openrouterEmbeddings';

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, '../.env.local') });

const PDFS_DIR = path.resolve(__dirname, '../../data-collection/pdfs');
const METADATA_DIR = path.resolve(__dirname, '../../data-collection/metadata');

function parseIngestArgs(): { maxPdfs?: number } {
  const argv = process.argv.slice(2);
  let maxPdfs: number | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--max-pdfs' && argv[i + 1]) {
      const n = parseInt(argv[i + 1], 10);
      if (Number.isFinite(n) && n > 0) maxPdfs = n;
      i++;
    }
  }
  return { maxPdfs };
}

async function main() {
  const { maxPdfs } = parseIngestArgs();

  console.log('🎾 TennisCoach AI - PDF Ingestion with Metadata');
  console.log('='.repeat(50));
  console.log(`PDF Directory: ${PDFS_DIR}`);
  console.log(`Metadata Directory: ${METADATA_DIR}`);
  console.log(`Using ChromaDB Cloud: ${process.env.CHROMADB_CLOUD === 'true' ? 'Yes' : 'No'}`);
  console.log(`Embeddings: OpenRouter ${OPENROUTER_EMBEDDING_MODEL}\n`);

  try {
    // Initialize vector store
    console.log('Step 1: Initializing ChromaDB...');
    const vectorStore = getVectorStore();
    await vectorStore.initialize();
    const stats = await vectorStore.getStats();
    console.log(`  Current collection size: ${stats?.count || 0} chunks\n`);

    // Process PDFs with metadata - upload chunks incrementally to save memory
    console.log('Step 2: Processing PDFs with metadata...\n');
    const processor = new PDFProcessor();

    let totalChunksUploaded = 0;
    const chunks = await processor.processDirectory(
      PDFS_DIR,
      METADATA_DIR,
      async (chunksForPDF) => {
        // Upload chunks for this PDF immediately
        if (chunksForPDF.length > 0) {
          await vectorStore.addChunks(chunksForPDF);
          totalChunksUploaded += chunksForPDF.length;
          console.log(`  ✓ Uploaded ${chunksForPDF.length} chunks to ChromaDB (total: ${totalChunksUploaded})\n`);
        }
      },
      maxPdfs != null ? { maxPdfs } : undefined
    );

    if (totalChunksUploaded === 0) {
      console.log('❌ No chunks uploaded. Exiting.');
      return;
    }

    // Verify
    const finalStats = await vectorStore.getStats();
    console.log(`\n✅ Ingestion complete!`);
    console.log(`   Total chunks in ChromaDB: ${finalStats?.count || 0}`);
    console.log(`   Total chunks uploaded: ${totalChunksUploaded}`);
    console.log('\n💡 Each chunk now includes:');
    console.log('   - Filename, category & origin (Semantic Scholar / ITF / ITF CSSR / USTA)');
    console.log('   - Paper ID & title');
    console.log('   - Authors & year');
    console.log('   - Source URL for citations');
  } catch (error) {
    console.error('❌ Error during ingestion:', error);
    process.exit(1);
  }
}

main();
