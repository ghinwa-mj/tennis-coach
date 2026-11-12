import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep heavy/native packages out of the webpack server bundle.
  // RAG still works at runtime via Chroma Cloud + OpenRouter embeddings.
  serverExternalPackages: [
    "chromadb",
    "@chroma-core/default-embed",
    "@chroma-core/ai-embeddings-common",
    "@huggingface/transformers",
    "onnxruntime-node",
    "onnxruntime-web",
    "pdf-parse",
    "pdf2json",
  ],
};

export default nextConfig;
