// Pure JavaScript test - NO tsx
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function extractCategory(filename) {
  const match = filename.match(/^([a-z]+)_/);
  return match ? match[1] : 'general';
}

function chunkText(text, filename) {
  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  let cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const category = extractCategory(filename);

  const baseMetadata = {
    filename,
    category,
  };

  while (startIndex < cleanedText.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, cleanedText.length);

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

  const totalPages = chunks.length;
  for (const chunk of chunks) {
    chunk.metadata.totalPages = totalPages;
  }

  return chunks;
}

console.log('🧪 Pure JS test (regular Node.js)\n');

const testText = 'This is a test. '.repeat(1000);
console.log(`Test text length: ${testText.length} characters\n`);

console.log('Chunking...');
const chunks = chunkText(testText, 'test_file.pdf');
console.log(`✅ Created ${chunks.length} chunks`);
console.log(`First chunk: "${chunks[0].text.substring(0, 50)}..."`);
console.log('\nSuccess! Regular Node.js works perfectly.');
