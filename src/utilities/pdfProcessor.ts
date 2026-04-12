import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface PaperMetadata {
  paperId: string;
  title: string;
  authors?: string[];
  year?: number;
  abstract?: string;
  url?: string;
  section: string;
  local_pdf?: string;
}

/**
 * Provenance label from path under `data-collection/pdfs/` (relative path, POSIX `/`).
 */
export function originFromPdfRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  if (!normalized.includes('/')) {
    return 'Semantic Scholar';
  }
  const top = normalized.split('/')[0];
  if (top === 'itf') return 'ITF';
  if (top === 'itf_cssr') return 'ITF Coaching & Sport Science Review';
  if (top === 'usta') return 'USTA';
  return 'Unknown';
}

/** Defaults; override with PDF_CHUNK_SIZE / PDF_CHUNK_OVERLAP in `.env.local` (ingest loads dotenv). */
function envPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface Chunk {
  text: string;
  metadata: {
    filename: string;
    category: string;
    chunkIndex: number;
    totalPages: number;
    /** Source corpus (from folder under pdfs/). */
    origin: string;
    // Citation metadata
    paperId?: string;
    title?: string;
    authors?: string[];
    year?: number;
    url?: string;
    abstract?: string;
  };
}

export class PDFProcessor {
  /** Characters per chunk target (before sentence-boundary adjustment). Default 1000. */
  private readonly CHUNK_SIZE = envPositiveInt('PDF_CHUNK_SIZE', 1000);
  /** Overlap between consecutive chunks. Default 200; often ~15–25% of chunk size. */
  private readonly CHUNK_OVERLAP = envPositiveInt('PDF_CHUNK_OVERLAP', 200);

  /**
   * All PDFs under dirPath (recursive), with paths relative to dirPath (POSIX-style for logs/IDs).
   */
  private collectPdfFiles(dirPath: string): { relativePath: string; fullPath: string }[] {
    const out: { relativePath: string; fullPath: string }[] = [];

    const walk = (current: string) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        return;
      }
      for (const ent of entries) {
        const full = path.join(current, ent.name);
        if (ent.isDirectory()) {
          walk(full);
        } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.pdf')) {
          const rel = path.relative(dirPath, full);
          const relativePath = rel.split(path.sep).join('/');
          out.push({ relativePath, fullPath: full });
        }
      }
    };

    walk(dirPath);
    out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return out;
  }

  /**
   * Load metadata for a PDF: prefers mirrored subfolders (e.g. metadata/itf_cssr/x.json for pdfs/itf_cssr/x.pdf),
   * then falls back to metadata/<basename>.json for flat layouts.
   */
  loadMetadata(relativePdfPath: string, metadataDir: string): PaperMetadata | null {
    const metaFromPdf = relativePdfPath.replace(/\.pdf$/i, '.json');
    const mirroredPath = path.join(metadataDir, metaFromPdf);

    let metadataPath: string | null = null;
    if (fs.existsSync(mirroredPath)) {
      metadataPath = mirroredPath;
    } else {
      const flatBasename = path.basename(metaFromPdf);
      const flatPath = path.join(metadataDir, flatBasename);
      if (fs.existsSync(flatPath)) {
        metadataPath = flatPath;
      }
    }

    if (!metadataPath) {
      console.log(`  ⚠ No metadata found for ${relativePdfPath}`);
      return null;
    }

    try {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent) as PaperMetadata;
      return metadata;
    } catch (error) {
      console.error(`  ⚠ Error loading metadata for ${relativePdfPath}:`, error);
      return null;
    }
  }

  /**
   * Extract text from a PDF file using pdftotext CLI tool
   * Much more memory-efficient than JS-based PDF parsers
   */
  async extractText(pdfPath: string): Promise<string> {
    const { exec } = require('child_process');
    const { promisify } = require('util');

    const execAsync = promisify(exec);

    try {
      // Use pdftotext with -layout option to preserve layout
      // Output to stdout (-) instead of file
      const { stdout, stderr } = await execAsync(`pdftotext -layout "${pdfPath}" -`);

      if (stderr && !stderr.includes('Syntax error')) {
        console.warn(`  ⚠ PDF warning: ${stderr.substring(0, 100)}`);
      }

      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Split text into chunks with overlap for better context
   * Optimized to reduce memory usage
   */
  chunkText(text: string, filename: string, metadata?: PaperMetadata | null): Chunk[] {
    const chunks: Chunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    // Clean the text in place to reduce string operations
    let cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Extract category once (basename only; nested paths like itf_cssr/foo.pdf use basename)
    const category = this.extractCategory(path.basename(filename));
    const origin = originFromPdfRelativePath(filename);

    // Prepare metadata once to avoid duplication
    const baseMetadata = {
      filename,
      category,
      origin,
      paperId: metadata?.paperId,
      title: metadata?.title,
      authors: metadata?.authors,
      year: metadata?.year,
      url: metadata?.url,
      abstract: metadata?.abstract,
    };

    while (startIndex < cleanedText.length) {
      const previousStartIndex = startIndex;
      const endIndex = Math.min(startIndex + this.CHUNK_SIZE, cleanedText.length);

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

      const rawSlice = cleanedText.substring(startIndex, breakPoint);
      const chunkText = rawSlice.trim();

      // Whitespace-only windows: advance without emitting a chunk (avoids bogus tiny/empty chunks).
      if (chunkText.length === 0) {
        startIndex = breakPoint;
        continue;
      }

      // Create chunk with minimal metadata duplication
      chunks.push({
        text: chunkText,
        metadata: {
          ...baseMetadata,
          chunkIndex,
          totalPages: 0, // Will be updated after
        },
      });

      // Overlap sliding: next window starts at breakPoint - overlap.
      // If that would not move forward (short tail, large overlap, or early break),
      // skip overlap for this step — do NOT use +1 (that inflates chunk count badly).
      const overlap = Math.min(this.CHUNK_OVERLAP, Math.max(0, this.CHUNK_SIZE - 1));
      let nextStart = breakPoint - overlap;
      if (nextStart <= previousStartIndex) {
        nextStart = breakPoint;
      }
      if (nextStart <= previousStartIndex) {
        nextStart = previousStartIndex + 1;
      }
      startIndex = nextStart;
      chunkIndex++;
    }

    // Update total pages
    const totalPages = chunks.length;
    for (const chunk of chunks) {
      chunk.metadata.totalPages = totalPages;
    }

    return chunks;
  }

  /**
   * Extract category from filename
   * Example: "forehand_abc123.pdf" -> "forehand"
   */
  private extractCategory(filename: string): string {
    const match = filename.match(/^([a-z]+)_/);
    return match ? match[1] : 'general';
  }

  /**
   * Process all PDFs in a directory
   * Processes PDFs one at a time and calls the callback with chunks for each PDF
   */
  async processDirectory(
    dirPath: string,
    metadataDir: string,
    onChunksCallback?: (chunks: Chunk[]) => Promise<void>,
    options?: { maxPdfs?: number }
  ): Promise<Chunk[]> {
    const allChunks: Chunk[] = [];

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    if (!fs.existsSync(metadataDir)) {
      console.log(`⚠ Warning: Metadata directory not found: ${metadataDir}`);
      console.log(`  Will process PDFs without metadata...\n`);
    }

    const allPdfEntries = this.collectPdfFiles(dirPath);
    const pdfEntries =
      options?.maxPdfs != null && options.maxPdfs > 0
        ? allPdfEntries.slice(0, options.maxPdfs)
        : allPdfEntries;

    if (allPdfEntries.length !== pdfEntries.length) {
      console.log(
        `Processing ${pdfEntries.length} of ${allPdfEntries.length} PDF(s) (--max-pdfs ${options!.maxPdfs}).\n`
      );
    }

    console.log(`Found ${pdfEntries.length} PDF files to process (including subfolders)...`);
    console.log(`Metadata directory: ${metadataDir}\n`);

    let processedCount = 0;
    let skippedCount = 0;
    let totalChunksGenerated = 0;

    for (const { relativePath, fullPath: filePath } of pdfEntries) {
      // Skip empty files
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.log(`Skipping empty file: ${relativePath}`);
        skippedCount++;
        continue;
      }

      try {
        // Load metadata (mirrored subfolders or flat basename fallback)
        const metadata = fs.existsSync(metadataDir)
          ? this.loadMetadata(relativePath, metadataDir)
          : null;

        console.log(`[${processedCount + 1}/${pdfEntries.length}] Processing: ${relativePath}`);
        if (metadata) {
          console.log(`  Title: ${metadata.title}`);
          console.log(`  Authors: ${metadata.authors?.join(', ') || 'Unknown'}`);
          console.log(`  Year: ${metadata.year || 'Unknown'}`);
        }

        const text = await this.extractText(filePath);

        // Skip files with too little text
        if (text.length < 50) {
          console.log(`  ⚠ Skipping ${relativePath} (too little text: ${text.length} chars)\n`);
          skippedCount++;
          continue;
        }

        const chunks = this.chunkText(text, relativePath, metadata);
        totalChunksGenerated += chunks.length;
        console.log(`  → Generated ${chunks.length} chunks (${text.length} chars)\n`);

        // Store chunks (when no callback, return value is used)
        allChunks.push(...chunks);

        // Upload chunks immediately if callback provided (saves memory)
        if (onChunksCallback) {
          await onChunksCallback(chunks);
          // Drop accumulated chunk bodies after upload; keep counts above
          allChunks.length = 0;
        }

        processedCount++;

        // Force garbage collection between PDFs to reduce memory pressure
        if (global.gc) {
          global.gc();
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${relativePath}:`, error);
        console.log();
        skippedCount++;
      }
    }

    console.log('='.repeat(50));
    console.log(`Processing Summary:`);
    console.log(`  ✅ Successfully processed: ${processedCount} files`);
    console.log(`  ⚠ Skipped: ${skippedCount} files`);
    console.log(`  📊 Total chunks generated: ${totalChunksGenerated}`);
    console.log('='.repeat(50));

    return allChunks;
  }
}
