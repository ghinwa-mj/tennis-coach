import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone/LAN testing hits the dev server via a private IP. Next.js 16 blocks
  // cross-origin requests to /_next/* unless that host is allowlisted — without
  // this, HTML renders but client JS/HMR gets 403 and the UI looks frozen.
  allowedDevOrigins: ["192.168.1.98", "192.168.*.*"],
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
