#!/usr/bin/env tsx

import path from 'path';
import { config } from 'dotenv';
import { PDFProcessor } from '../src/utilities/pdfProcessor';
import { getVectorStore } from '../src/lib/rag/vectorStore';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') });

const PDFS_DIR = path.resolve(__dirname, '../../data-collection/pdfs');
const METADATA_DIR = path.resolve(__dirname, '../../data-collection/metadata');

async function main() {
  console.log('🧪 Testing single PDF processing...\n');

  const processor = new PDFProcessor();
  const vectorStore = getVectorStore();
  await vectorStore.initialize();

  // Process just ONE PDF
  const testFile = 'fitness_03cc3a6a4c76ce82a873a3de990aa72bb739f6bf.pdf';
  const pdfPath = path.join(PDFS_DIR, testFile);

  console.log(`Processing: ${testFile}`);

  // Load metadata
  const metadata = processor.loadMetadata(testFile, METADATA_DIR);
  console.log(`  Title: ${metadata?.title}`);
  console.log(`  Authors: ${metadata?.authors?.join(', ')}`);
  console.log(`  Year: ${metadata?.year}\n`);

  // Extract text
  console.log('Extracting text...');
  const text = await processor.extractText(pdfPath);
  console.log(`  Extracted ${text.length} characters\n`);

  // Chunk
  console.log('Chunking text...');
  const chunks = processor.chunkText(text, testFile, metadata);
  console.log(`  Created ${chunks.length} chunks\n`);

  // Add to ChromaDB
  console.log('Uploading to ChromaDB...');
  await vectorStore.addChunks(chunks);

  // Verify
  const stats = await vectorStore.getStats();
  console.log(`\n✅ Success! Total chunks in ChromaDB: ${stats?.count}`);

  // Test search
  console.log('\n🔍 Testing search...');
  const results = await vectorStore.search('tennis fitness training', 3);
  console.log(`Found ${results.length} results`);
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.metadata.title}`);
    console.log(`   Score: ${r.score}`);
    console.log(`   Text: ${r.text.substring(0, 100)}...`);
  });
}

main().catch(console.error);
