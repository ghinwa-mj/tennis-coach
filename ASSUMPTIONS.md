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

---

# YouTube Recommendations Assumptions

## Overview
This document outlines the assumptions, design decisions, and technical choices for the YouTube Video Recommendations feature in TennisCoach AI.

## Architecture & Design Decisions

### 1. Layout & Navigation
- **Sidebar Navigation**: Two-tab layout (Chat and Video Recommendations)
  - Left sidebar with tab icons and labels
  - Active tab highlighting with color change (gray → green)
  - Assumption: Users want easy switching between coaching chat and video learning

- **Responsive Grid**: Videos displayed in responsive grid
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3 columns (perfect for 6 videos in 2 rows)
  - Assumption: 3-column layout provides optimal viewing experience

### 2. Video Display
- **Video Limit**: Maximum 6 videos shown per search
  - Personalized search: 6 videos
  - Custom search: 6 videos
  - Assumption: 6 videos provide sufficient variety without overwhelming users

- **Video Card Information**:
  - Thumbnail (16:9 aspect ratio, h-52 height)
  - Title (truncated to 2 lines)
  - Channel name
  - Duration (formatted from ISO 8601)
  - View count (formatted with K/M suffix)
  - Publish date (human-readable format)
  - Assumption: This information helps users decide which videos to watch

### 3. Recommendation Strategy

#### Personalized Search (Profile-Based)
- **Input**: User profile (skillLevel, goals, focusAreas, etc.)
- **Process**:
  1. Claude analyzes profile
  2. Generates 2 YouTube search queries
  3. YouTube API searches for 6 videos per query
  4. Deduplicates by video ID
  5. Returns top 6 unique videos
- **Assumption**: Claude-generated queries provide better results than simple profile matching

#### Custom Search
- **Input**: User's natural language description
- **Process**:
  1. Uses user's exact query as search term
  2. YouTube API searches for 6 videos
  3. Returns top 6 results
- **Assumption**: Users know best what they want to learn; exact search is more effective than AI interpretation

### 4. Persona Validation
- **Requirement**: User must have `skillLevel` defined
  - Changed from requiring BOTH `skillLevel` AND `hasCompletedOnboarding`
  - Assumption: If skillLevel is set, user has completed onboarding
  - Edge case: Profile may have skillLevel but hasCompletedOnboarding=false

- **Missing Profile Handling**:
  - Shows "Complete Your Profile" message
  - Button switches to Chat tab
  - Instructs user to click "👤 Profile" button
  - Assumption: Profile button in Chat header is the intended setup flow

### 5. API Integration
- **YouTube Data API v3**:
  - Endpoint: `https://www.googleapis.com/youtube/v3`
  - Search API: `/search` (finds videos)
  - Videos API: `/videos` (gets duration, view count)
  - Environment variable: `YOUTUBE_v3_API`
  - Assumption: API key is valid and has sufficient quota (10,000 units/day)

- **API Quota Management**:
  - Each search costs ~100 units
  - Can make ~100 searches per day
  - Assumption: Current usage is well within quota limits
  - Future: Implement caching to reduce API calls

### 6. Error Handling
- **YouTube API Failures**: Graceful degradation
  - If search fails, continues to next query (for personalized search)
  - If all queries fail, shows "No videos found" message
  - Assumption: Partial results are better than complete failure

- **No Results Scenario**:
  - Shows friendly "No videos found" message
  - Provides "Refresh Recommendations" button
  - Assumption: Users understand that not all searches return results

### 7. Video Playback
- **Embedded Player**: YouTube iframe embed
  - Opens in modal overlay
  - Autoplay enabled
  - Close button returns to video grid
  - Assumption: Embedded playback keeps users in the app (better UX than external links)

### 8. Reasoning Text
- **Personalized Search**: Dynamic reasoning based on profile
  - Example: "Based on your intermediate skill level and goal to improve-technique, focusing on forehand, I found these videos to help you improve."
  - Handles missing goals/focusAreas gracefully (no "focusing on undefined")
  - Assumption: Reasoning helps users understand why videos were recommended

- **Custom Search**: Direct quote of user's request
  - Example: 'Based on your request for "backhand slice tips", I found these videos to help you improve.'
  - Assumption: Users want confirmation that their specific request was understood

### 9. Performance Considerations
- **API Call Latency**: Each recommendation request takes 5-10 seconds
  - Claude API: ~1-2 seconds (profile analysis)
  - YouTube API: ~2-3 seconds per search query
  - Assumption: This latency is acceptable for personalized recommendations

- **Loading States**: Clear visual feedback
  - Spinner + "Finding the best videos for you..." message
  - Assumption: Users need feedback during API calls

### 10. Future Enhancements (Out of Scope)

#### Phase 2 Features
1. **Chat History Integration**
   - Analyze actual conversation topics
   - Identify patterns in questions
   - Recommend videos based on recent discussions
   - Assumption: Conversation context improves recommendations

2. **Topic Filters**
   - Filter by category (Forehand, Backhand, Serve, Volley, Fitness, Strategy)
   - Multi-select filters
   - Save filter preferences
   - Assumption: Users want to browse videos by topic

3. **Video Actions**
   - Save to "Watch Later" list
   - Mark as "Watched"
   - Rate videos (helpful/not helpful)
   - Share recommendations
   - Assumption: Users want to track and curate their video library

4. **Improved Personalization**
   - Track which videos user watches
   - Learn from feedback
   - Adjust future recommendations
   - Assumption: User behavior data improves recommendation quality

5. **Caching Strategy**
   - Cache recommendations for 5-10 minutes
   - Reduce API calls for repeated searches
   - Assumption: Caching improves performance without reducing relevance

6. **Additional Video Sources**
   - Add other platforms (Vimeo, tennis-specific sites)
   - Curated content from coaches
   - Assumption: Multiple sources provide broader content coverage

7. **Advanced Features**
   - Video playlists for specific training programs
   - Progress tracking with video completion
   - Community-shared recommendations
   - Assumption: Social features increase engagement

## Configuration Constants
- `MAX_VIDEOS = 6`: Maximum videos to show per search
- `VIDEOS_PER_QUERY = 6`: Videos to fetch per YouTube API call
- `SEARCH_QUERIES_COUNT = 2`: Number of queries for personalized search
- `CUSTOM_QUERY_MAX_VIDEOS = 6`: Videos for custom search

## Environment Variables Required
- `YOUTUBE_v3_API`: YouTube Data API v3 key
- `ANTHROPIC_API_KEY`: For Claude integration (already exists)
- `LANGSMITH_API_KEY`: For analytics (already exists)

## Testing & Validation
- **Manual Testing Completed**:
  - [x] Profile validation
  - [x] Personalized search (profile-based)
  - [x] Custom search functionality
  - [x] Video card display
  - [x] Embedded player
  - [x] Refresh button
  - [x] Tab navigation
  - [x] Error handling (no profile, no results)
  - [x] Reasoning text formatting

- **Success Metrics**:
  - Videos load successfully with valid profile
  - Custom search returns relevant results
  - Embedded player works correctly
  - No breaking changes to chat functionality
  - Mobile responsive layout

## Known Issues & Limitations
1. **No Caching**: Every search calls YouTube API (could hit quota limits)
2. **Single Source**: Only YouTube (no alternative video platforms)
3. **No Persistence**: Custom searches not saved
4. **No Video Previews**: No hover preview or thumbnail gallery
5. **Limited Filter Options**: Can't filter by duration, upload date, or view count

## Dependencies
- `@anthropic-ai/sdk`: ^0.88.0 (Claude API)
- YouTube Data API v3 (REST API)

## Files Created
- `src/lib/youtube/types.ts`: TypeScript types for YouTube API
- `src/lib/youtube/search.ts`: YouTube API client
- `src/components/Sidebar.tsx`: Navigation sidebar
- `src/components/VideoRecommendations.tsx`: Main recommendations view
- `src/components/VideoCard.tsx`: Individual video card
- `src/components/EmbeddedPlayer.tsx`: YouTube player modal
- `src/app/api/recommendations/route.ts`: Backend API endpoint

## Files Modified
- `src/app/page.tsx`: Added sidebar layout
- `src/components/ChatInterface.tsx`: Changed h-screen to h-full for layout compatibility

## Date of Implementation
April 15, 2026

## Version
1.0.0 - Initial YouTube Recommendations implementation
