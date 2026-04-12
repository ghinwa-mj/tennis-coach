#!/usr/bin/env tsx

import path from 'path';
import { config } from 'dotenv';
import { PDFProcessor } from '../src/utilities/pdfProcessor';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') });

const PDFS_DIR = path.resolve(__dirname, '../../data-collection/pdfs');
const METADATA_DIR = path.resolve(__dirname, '../../data-collection/metadata');

async function main() {
  console.log('🧪 Testing chunking WITHOUT ChromaDB...\n');

  const processor = new PDFProcessor();
  const testFile = 'fitness_03cc3a6a4c76ce82a873a3de990aa72bb739f6bf.pdf';
  const pdfPath = path.join(PDFS_DIR, testFile);

  console.log(`Processing: ${testFile}`);

  // Load metadata
  const metadata = processor.loadMetadata(testFile, METADATA_DIR);
  console.log(`  Title: ${metadata?.title}\n`);

  // Extract text
  console.log('Extracting text...');
  const text = await processor.extractText(pdfPath);
  console.log(`  ✓ Extracted ${text.length} characters\n`);

  // Chunk - THIS IS WHERE IT CRASHES
  console.log('Chunking text...');
  const chunks = processor.chunkText(text, testFile, metadata);
  console.log(`  ✓ Created ${chunks.length} chunks\n`);

  // Show first chunk
  console.log('First chunk preview:');
  console.log(chunks[0].text.substring(0, 200));
  console.log('\n✅ Success! No ChromaDB involved.');
}

main().catch(console.error);
