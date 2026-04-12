// Pure chunking test - NO dependencies
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function extractCategory(filename: string): string {
  const match = filename.match(/^([a-z]+)_/);
  return match ? match[1] : 'general';
}

function chunkText(text: string, filename: string): any[] {
  const chunks: any[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  // Clean the text in place
  let cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract category once
  const category = extractCategory(filename);

  // Prepare base metadata once
  const baseMetadata = {
    filename,
    category,
  };

  while (startIndex < cleanedText.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, cleanedText.length);

    // Try to break at a sentence boundary
    let breakPoint = endIndex;
    if (endIndex < cleanedText.length) {
      const sentenceEndings = ['.', '!', '?', '\n\n'];
      for (let i = 0; i < 100; i++) {
        const lookBack = endIndex - i;
        if (lookBack <= startIndex) break;
        if (sentenceEndings.includes(cleanedText[lookBack])) {
          breakPoint = lookBack + 1;
          break;
        }
      }
    }

    const chunkText = cleanedText.substring(startIndex, breakPoint).trim();

    // Create chunk
    chunks.push({
      text: chunkText,
      metadata: {
        ...baseMetadata,
        chunkIndex,
        totalPages: 0,
      },
    });

    startIndex = breakPoint - CHUNK_OVERLAP;
    chunkIndex++;
  }

  // Update total pages
  const totalPages = chunks.length;
  for (const chunk of chunks) {
    chunk.metadata.totalPages = totalPages;
  }

  return chunks;
}

// Test with a simple text
console.log('🧪 Pure chunking test (no dependencies)\n');

const testText = 'This is a test. '.repeat(1000); // ~18KB
console.log(`Test text length: ${testText.length} characters\n`);

console.log('Chunking...');
const chunks = chunkText(testText, 'test_file.pdf');
console.log(`✅ Created ${chunks.length} chunks`);
console.log(`First chunk: "${chunks[0].text.substring(0, 50)}..."`);
console.log('\nSuccess! Pure chunking works fine.');
