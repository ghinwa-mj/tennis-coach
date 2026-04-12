import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration to handle ChromaDB modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize ChromaDB modules to avoid bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@chroma-core/ai-embeddings-common': 'commonjs @chroma-core/ai-embeddings-common',
        '@chroma-core/default-embed': 'commonjs @chroma-core/default-embed',
      });
    }
    return config;
  },
};

export default nextConfig;
