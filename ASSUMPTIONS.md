# RAG Implementation Assumptions

## Overview
This document outlines the assumptions, design decisions, and technical choices made during the implementation of the Retrieval-Augmented Generation (RAG) system for TennisCoach AI.

## Architecture & Design Decisions

### 1. Retrieval Strategy
- **Embedding Model**: OpenRouter's `openai/text-embedding-3-small`
  - Chosen for cost-effectiveness and good performance on general text
  - Embedding dimension: 1536 (default for this model)
  - Assumption: This model provides sufficient semantic understanding for tennis coaching content

- **Vector Store**: ChromaDB (Cloud-hosted)
  - Already configured with existing tennis literature
  - Assumption: Cloud-hosted ChromaDB provides adequate performance and reliability

- **Top-K Retrieval**: Fixed at K=5 documents per query
  - Assumption: 5 documents provide sufficient context without overwhelming the prompt
  - Trade-off: More documents = more context but higher token usage and potential for noise

### 2. Citation System
- **Citation Format**: `[Source X]` where X is the document number (1-5)
  - Simple, user-friendly format
  - Assumption: Numbered citations are easier to reference than author-year format

- **Citation Display**: Sources shown below assistant message in blue box
  - Visual distinction makes it clear what's from the knowledge base
  - Assumption: Users want to see source attribution for trust and verification

### 3. Prompt Engineering
- **Base System Prompt**: Existing TennisCoach AI prompt used as foundation
- **RAG Augmentation**: Retrieved documents appended with explicit citation requirements
- **Citation Instruction Format**:
  ```
  **IMPORTANT CITATION REQUIREMENTS:**
  - When you use information from these documents, you MUST cite it using the format [Source X]
  - If you combine information from multiple sources, cite all of them: [Source 1][Source 3]
  - If the answer doesn't come from the documents, you can still use your general tennis knowledge
  ```

- **Assumption**: Explicit citation requirements lead to consistent citation behavior from the LLM
- **Trade-off**: Strong citation enforcement may reduce response fluency slightly

### 4. User Interface
- **RAG Toggle**: Button in header (📚 RAG On/Off)
  - Users can enable/disable RAG per session
  - Setting persisted in localStorage
  - Assumption: Users want control over when to use the knowledge base

- **Visual Design**:
  - RAG On: Blue button (active state)
  - RAG Off: Gray button (inactive state)
  - Sources displayed in blue box below response
  - Assumption: Color coding makes RAG state clear at a glance

### 5. Error Handling
- **RAG Failures**: Graceful degradation
  - If vector store query fails, chat continues without RAG
  - Assumption: Partial functionality is better than complete failure
  - User sees normal response without sources

- **Empty Results**: No special handling
  - If no relevant documents found, system proceeds without retrieved context
  - Assumption: LLM will provide good general advice even without specific documents

### 6. Performance Considerations
- **Latency Impact**: RAG adds ~1-2 seconds per query
  - Vector store query: ~500ms
  - Embedding generation: ~300ms
  - Assumption: This latency is acceptable for the value added

- **Token Usage**: RAG increases prompt size
  - Each retrieved document: ~500-1000 tokens (depends on chunk size)
  - Total additional: ~2500-5000 tokens for 5 documents
  - Assumption: Within acceptable cost/performance bounds

### 7. Data & Metadata
- **Document Metadata Available**:
  - filename
  - category
  - chunkIndex
  - totalPages
  - origin
  - paperId (for academic papers)
  - title
  - authors
  - year
  - url

- **Citation Format**: Prioritizes title, then year + authors
  - Format: `"Title (year) by authors"` or `"Title (year)"` or `"Title"`
  - Assumption: This hierarchy provides the most useful citation format

### 8. Retrieval Scope
- **Query Scope**: Only the latest user message is embedded for retrieval
  - Not: Conversation history, previous messages
  - Assumption: Latest message contains the core question/topic
  - Trade-off: May miss context from earlier in conversation

### 9. Integration with Existing Features
- **Personalization**: RAG works with user profiles
  - System prompt includes both profile personalization AND retrieved documents
  - Assumption: These two features are complementary, not conflicting

- **Thread Tracking**: RAG state included in LangSmith metadata
  - Enables analysis of RAG usage patterns
  - Assumption: Analytics will help optimize RAG performance

### 10. Future Optimization Opportunities
1. **Adaptive Top-K**: Adjust K based on query complexity
2. **Query Expansion**: Use conversation history for better retrieval
3. **Reranking**: Add a reranking step to improve relevance
4. **Hybrid Search**: Combine semantic search with keyword search
5. **Citation Quality Metrics**: Track how well LLM follows citation requirements

## Configuration Constants
- `TOP_K_RESULTS = 5`: Number of documents to retrieve
- `EMBEDDING_MODEL = "openai/text-embedding-3-small"`
- `CHUNK_SIZE = 2500` (from .env.local)
- `CHUNK_OVERLAP = 250` (from .env.local)

## Environment Variables Required
- `OPENROUTER_API_KEY`: For embedding generation
- `CHROMADB_API_KEY`: For vector store access
- `CHROMADB_TENANT`: ChromaDB tenant ID
- `CHROMADB_DATABASE`: Database name
- `CHROMADB_CLOUD`: Set to "true" for cloud-hosted ChromaDB

## Testing & Validation
- **Manual Testing Required**:
  - [ ] RAG toggle functionality
  - [ ] Citation accuracy
  - [ ] Source display formatting
  - [ ] Error handling (vector store failures)
  - [ ] Performance under load

- **Success Metrics**:
  - Citations appear in ≥80% of RAG-enabled responses
  - Citations accurately reference used documents
  - RAG latency <3 seconds per query
  - Zero chat failures due to RAG errors

## Dependencies
- `chromadb`: ^3.4.3
- `@anthropic-ai/sdk`: ^0.88.0
- LangSmith wrappers for Anthropic
- OpenRouter API for embeddings

## Date of Implementation
April 12, 2026

## Version
1.0.0 - Initial RAG implementation
