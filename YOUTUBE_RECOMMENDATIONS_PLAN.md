# YouTube Recommendations Feature - Implementation Plan

## Overview
Add a sidebar with "Chat" and "Personalized Video Recommendations" tabs that uses YouTube Data API v3 to suggest videos based on the user's persona and conversation history.

---

## Architecture

### Current Structure
```
ChatInterface (full page)
├── Messages area
├── Input area
└── Onboarding/Profile modals
```

### New Structure
```
Main Layout
├── Sidebar
│   ├── Tab: Chat
│   └── Tab: Video Recommendations
└── Content Area
    ├── [When Chat tab active] ChatInterface
    │   ├── Messages area
    │   └── Input area
    └── [When Video tab active] VideoRecommendations
        └── Video grid (5 videos embedded)
```

---

## Technical Components

### 1. **Layout Component** (`src/app/page.tsx`)
- Split view: Left sidebar + Right content area
- Responsive design (collapsible sidebar on mobile)
- Tab switching logic

### 2. **Sidebar Component** (`src/components/Sidebar.tsx`)
- Two tabs: "Chat" and "Video Recommendations"
- Active tab highlighting
- Future: Chat History section below Chat tab

### 3. **Video Recommendations Component** (`src/components/VideoRecommendations.tsx`)
- State: Loading, Empty (no persona), Error, Loaded
- Grid of 5 video cards
- Each card: Thumbnail, Title, Channel, Duration, Views
- Embedded YouTube player on click
- Refresh button to get new recommendations

Notes: If no persona --> Give a pop-up to incentivize the user to define their persona

### 4. **Backend API** (`src/app/api/recommendations/route.ts`)
**Endpoint:** `POST /api/recommendations`

**Request:**
```typescript
{
  userProfile: UserProfile,
  conversationSummary?: string,  // Future: from chat history
  ragEnabled: boolean
}
```

**Response:**
```typescript
{
  recommendations: Array<{
    videoId: string,
    title: string,
    channel: string,
    thumbnail: string,
    duration: string,
    views: string,
    publishDate: string
  }>,
  reasoning: string  // Why these videos were recommended
}
```

**Logic:**
1. Check if user has completed persona (skill level, goals, focus areas)
2. If no persona → Gracefully, return error guiding user to complete onboarding
3. Build prompt for Claude based on user profile
4. Ask Claude to:
   - Analyze user's skill level, goals, focus areas
   - Identify weak areas or topics to work on
   - Generate 2 search queries for YouTube (for now)
5. For each search query, call YouTube Data API v3
6. Return top results (deduplicated, max 5 total)

---

## File Structure

### New Files
```
src/
├── app/
│   ├── api/
│   │   └── recommendations/
│   │       └── route.ts          # New API endpoint
│   └── page.tsx                   # Modify: Add layout wrapper
├── components/
│   ├── Sidebar.tsx                # New: Tab navigation
│   ├── VideoRecommendations.tsx   # New: Video grid
│   ├── VideoCard.tsx              # New: Individual video card
│   └── EmbeddedPlayer.tsx         # New: YouTube player
├── lib/
│   └── youtube/
│       ├── search.ts              # New: YouTube API client
│       └── types.ts               # New: YouTube types
└── types/
    └── recommendations.ts          # New: Recommendation types
```

### Modified Files
```
src/
├── app/
│   └── page.tsx                   # Modify: Add layout wrapper
├── components/
│   └── ChatInterface.tsx          # Modify: Extract layout logic
```

---

## Implementation Steps

### Phase 1: Layout & Navigation (Priority: High)
1. **Create `src/components/Sidebar.tsx`**
   - Tab switching logic
   - Chat tab icon/text
   - Video Recommendations tab icon/text
   - Active tab styling

2. **Modify `src/app/page.tsx`**
   - Add two-column layout (sidebar + content)
   - State: `activeTab` ('chat' | 'videos')
   - Conditionally render ChatInterface or VideoRecommendations

3. **Test sidebar navigation**
   - Click tabs → content switches
   - Responsive on mobile

### Phase 2: YouTube API Client (Priority: High)
4. **Create `src/lib/youtube/search.ts`**
   - YouTube Data API v3 integration
   - Search function: `searchVideos(query, maxResults = 5)`
   - Handle API key from `process.env.YOUTUBE_V3_API`
   - Format response (videoId, title, thumbnail, etc.)

5. **Create `src/lib/youtube/types.ts`**
   - YouTube API response types
   - Video recommendation types

6. **Test YouTube API**
   - Manual test with sample query
   - Verify API key works
   - Check response format

### Phase 3: Backend API - Persona Analysis (Priority: High)
7. **Create `src/app/api/recommendations/route.ts`**
   - Check user has completed persona (skill level required)
   - Build prompt for Claude
   - Call Claude to analyze profile & generate search queries
   - Call YouTube API for each query
   - Deduplicate and limit to 5 results
   - Return recommendations + reasoning

8. **Prompt Engineering for Claude**
   - Input: User profile (skill level, goals, focus areas, injuries, etc.)
   - Output: 3-5 YouTube search queries
   - Example prompts for different skill levels

9. **Test API endpoint**
   - Test with complete persona → Should return videos
   - Test without persona → Should error gracefully
   - Verify search queries make sense for profile

### Phase 4: Frontend - Video Display (Priority: Medium)
10. **Create `src/components/VideoRecommendations.tsx`**
    - States: Loading, NoPersona, Error, Success
    - Fetch from `/api/recommendations`
    - Display reasoning text
    - Grid of 5 video cards
    - Refresh button

11. **Create `src/components/VideoCard.tsx`**
    - Thumbnail image
    - Title (truncated if long)
    - Channel name
    - Duration (formatted)
    - View count (formatted)
    - Click → Opens embedded player

12. **Create `src/components/EmbeddedPlayer.tsx`**
    - YouTube iframe embed
    - Close button
    - Modal or expandable card

13. **Test video display**
    - Load videos from API
    - Click card → Opens player
    - Close player → Returns to grid
    - Refresh → Gets new recommendations

### Phase 5: Error Handling & Edge Cases (Priority: Medium)
14. **Handle no persona**
    - Show message: "Complete your profile first"
    - Button to open Profile modal
    - Link to onboarding if needed

15. **Handle API errors**
    - YouTube API quota exceeded
    - No results found
    - Network errors

16. **Handle empty results**
    - No videos found for queries
    - Alternative: Fallback to general tennis videos

### Phase 6: Polish & Refinement (Priority: Low)
17. **Styling improvements**
    - Loading spinners
    - Hover effects on cards
    - Smooth transitions between tabs
    - Mobile responsiveness

18. **Performance**
    - Cache recommendations (5-10 min)
    - Lazy load thumbnails
    - Debounce refresh button

---

## Claude Prompt for Recommendations

### System Prompt Template
```
You are analyzing a tennis player's profile to recommend YouTube videos that will help them improve.

User Profile:
- Skill Level: {skillLevel}
- Goals: {goals}
- Focus Areas: {focusAreas}
- Injuries: {injuries}
- Playing Style: {playingStyle}
- Years Playing: {yearsPlaying}

Based on this profile:
1. Identify their current skill level and what they should focus on
2. Consider their goals and focus areas
3. Be mindful of any injuries
4. Generate 3-5 specific YouTube search queries that would help them

Each search query should:
- Be specific to tennis technique/tactics
- Match their skill level (beginner terms for beginners, advanced for advanced)
- Address their goals and focus areas
- Account for injuries if present

Return ONLY a JSON array of search query strings:
["query 1", "query 2", "query 3", "query 4", "query 5"]
```

### Example Profiles & Queries

**Beginner Example:**
```
Profile: Beginner, wants to learn forehand
→ ["beginner tennis forehand basics", "how to hit forehand tennis beginner", "tennis forehand grip for beginners"]
```

**Intermediate Example:**
```
Profile: 3.0-3.5 NTRP, focus on serve consistency
→ ["improve tennis serve consistency intermediate", "tennis serve toss drills", "second serve tennis tips"]
```

**Advanced Example:**
```
Profile: 4.5+ NTRP, wants to improve volley
→ ["advanced tennis volley technique", "net game transition tennis", "tennis volley drills advanced"]
```

---

## Testing Checklist

### Manual Testing
- [ ] Without persona → Shows "Complete profile first" message
- [ ] With persona → Loads 5 videos
- [ ] Videos display correctly (thumbnail, title, channel, duration, views)
- [ ] Click video → Opens embedded player
- [ ] Close player → Returns to grid
- [ ] Refresh button → Gets new recommendations
- [ ] Reasoning text makes sense for profile
- [ ] Switch between Chat and Video tabs
- [ ] Responsive on mobile

### API Testing
- [ ] `/api/recommendations` with valid profile → 200 OK
- [ ] `/api/recommendations` without skill level → Error
- [ ] YouTube API search works
- [ ] Claude generates relevant search queries
- [ ] Results are deduplicated

### Edge Cases
- [ ] YouTube API quota exceeded → Graceful error
- [ ] No results found → Fallback message
- [ ] Network error → Retry option
- [ ] Persona has missing fields → Works with available data

---

## Future Enhancements (Out of Scope)

### Phase 2+ Features
1. **Chat History Integration**
   - Analyze actual conversation topics
   - Identify patterns in questions
   - Recommend videos based on recent discussions

2. **Topic Filters**
   - Filter by category (Forehand, Backhand, Serve, Volley, Fitness, Strategy)
   - Multi-select filters
   - Save filter preferences

3. **Video Actions**
   - Save to "Watch Later" list
   - Mark as "Watched"
   - Rate videos (helpful/not helpful)
   - Share recommendations

4. **Improved Personalization**
   - Track which videos user watches
   - Learn from feedback
   - Adjust future recommendations

5. **Additional Video Sources**
   - Add other platforms (Vimeo, tennis-specific sites)
   - Curated content from coaches

6. **Advanced Features**
   - Video playlists for specific training programs
   - Progress tracking with video completion
   - Community-shared recommendations

---

## API Keys & Environment Variables

### Required (Already exists)
```bash
YOUTUBE_V3_API=your_api_key_here
```

### Optional (Future)
```bash
YOUTUBE_API_QUOTA=10000  # Track usage
```

---

## Success Criteria

- ✅ User can switch between Chat and Video tabs
- ✅ Without persona → Clear guidance to complete profile
- ✅ With persona → 5 relevant YouTube videos displayed
- ✅ Videos are personalized based on skill level and goals
- ✅ Embedded video player works within app
- ✅ Claude reasoning explains why videos were recommended
- ✅ Smooth UX with loading states and error handling
- ✅ Mobile responsive
- ✅ No breaking changes to existing chat functionality

---

## Estimated Implementation Order

**Session 1 (Core functionality):**
- Steps 1-3: Layout & Sidebar
- Steps 4-6: YouTube API client
- Step 7: Backend API endpoint
- Steps 10-11: Video display components

**Session 2 (Refinement):**
- Step 8: Prompt engineering
- Step 12: Embedded player
- Steps 14-16: Error handling
- Testing & bug fixes

**Session 3 (Polish - Optional):**
- Steps 17-18: Styling & performance
- Final testing
- Documentation

---

## Notes & Assumptions

1. **YouTube API v3 Quota**: 10,000 units/day. Each search costs ~100 units. We can make ~100 searches/day. Should implement caching.

2. **Persona Requirement**: Feature only works if user has `skillLevel` defined. This is part of onboarding.

3. **Video Embedding**: Using YouTube iframe embed API. No auth required.

4. **Future Chat History**: When we add persistence, we'll summarize conversations and pass to Claude for better recommendations.

5. **Mobile UX**: Sidebar should be collapsible or bottom navigation on mobile.

6. **Caching**: Store recommendations for 5-10 minutes to avoid excessive API calls.

---

## Questions & Clarifications Needed

- [ ] Confirm sidebar layout (left side vs bottom on mobile)
- [ ] Confirm max 5 videos is good, or prefer more/less?
- [ ] Should videos autoplay in embedded player or wait for user to click play?
- [ ] Any specific YouTube channels to prioritize or exclude?
- [ ] Should we show Claude's reasoning to users, or keep it internal?

---

**Please edit this file directly with your changes, then let me know when you're ready for me to implement!**
