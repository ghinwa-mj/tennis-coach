#!/usr/bin/env tsx
/**
 * Clear ChromaDB and re-ingest all PDFs with URL support
 */

import path from 'path';
import { config } from 'dotenv';
import { PDFProcessor } from '../src/utilities/pdfProcessor';
import { getVectorStore } from '../src/lib/rag/vectorStore';
import { OPENROUTER_EMBEDDING_MODEL } from '../src/lib/rag/openrouterEmbeddings';

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, '../.env.local') });

const PDFS_DIR = path.resolve(__dirname, '../../data-collection/pdfs');
const METADATA_DIR = path.resolve(__dirname, '../../data-collection/metadata');

async function main() {
  console.log('🎾 TennisCoach AI - Clear & Re-ingest with URLs');
  console.log('='.repeat(50));
  console.log('⚠️  WARNING: This will DELETE all existing data in ChromaDB!');
  console.log('');

  try {
    // Initialize vector store
    console.log('Step 1: Initializing ChromaDB...');
    const vectorStore = getVectorStore();
    await vectorStore.initialize();
    const stats = await vectorStore.getStats();
    console.log(`  Current collection size: ${stats?.count || 0} chunks\n`);

    // Clear the collection
    console.log('Step 2: Clearing existing data...');
    await vectorStore.clear();
    const statsAfterClear = await vectorStore.getStats();
    console.log(`  Collection size after clear: ${statsAfterClear?.count || 0} chunks\n`);

    // Re-ingest with updated URL support
    console.log('Step 3: Re-ingesting all PDFs with URL support...\n');
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
          console.log(`  ✓ Uploaded ${chunksForPDF.length} chunks (total: ${totalChunksUploaded})`);
        }
      }
    );

    if (totalChunksUploaded === 0) {
      console.log('❌ No chunks uploaded. Exiting.');
      return;
    }

    // Verify
    const finalStats = await vectorStore.getStats();
    console.log(`\n✅ Re-ingestion complete!`);
    console.log(`   Total chunks in ChromaDB: ${finalStats?.count || 0}`);
    console.log(`   Total chunks uploaded: ${totalChunksUploaded}`);
    console.log('\n💡 All chunks now include:');
    console.log('   - Filename, category & origin');
    console.log('   - Paper ID & title');
    console.log('   - Authors & year');
    console.log('   - ✨ Source URLs (article_url, pdf_url, or url)');
  } catch (error) {
    console.error('❌ Error during re-ingestion:', error);
    process.exit(1);
  }
}

main();
