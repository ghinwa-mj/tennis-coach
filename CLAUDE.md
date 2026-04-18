# TennisCoach AI

A personalized tennis coaching application that uses RAG (Retrieval Augmented Generation) to provide tailored coaching advice based on ITF coaching literature, combined with YouTube video recommendations.

## Tech Stack

**Frontend:**
- Next.js 16.2.3 (App Router) - Latest version with breaking changes from v15
- React 19
- TypeScript
- Tailwind CSS v4 (inline @theme configuration)

**AI & Data:**
- OpenRouter API for LLM responses
- ChromaDB Cloud for vector storage
- OpenAI embeddings for RAG
- YouTube Data API v3 for video recommendations

**Styling:**
- Custom clay/terracotta color theme
- Lucide React icons (no emojis)
- Cormorant Garamond (headings), Source Sans 3 (body), JetBrains Mono (code)

## Design System

### Color Palette
- **Primary (Clay/Terracotta):** #E07A5F (clay-300), #C15642 (clay-400)
- **Secondary (Wimbledon Grass Green):** #4CAF50 (wimbledon-500), #43A047 (wimbledon-600)
- **Accent (Australian Open Blue):** #1E88E5 (ausopen-500), #1976D2 (ausopen-600)
- **Backgrounds:** #FAFAF5 (clay-50 - app bg), #FAF0E6 (clay-100 - sidebar/chat)
- **Text:** #1A1C29 (navy-900), #3D405B (navy-50)

### Design Patterns
- **Left Rail Navigation:** 64px collapsed, 240px expanded (NOT a sidebar)
- **Ticket-Stub Messages:** Border-left accent, metadata header (timestamp)
- **Icons:** ALWAYS use Lucide React, never emojis
- **Active States:** wimbledon-500 with hover to wimbledon-600
- **AI Elements:** Use ausopen-500 (Australian Open blue)

### Typography
- **Headings:** `font-heading` (Cormorant Garamond, serif)
- **Body:** `font-sans` (Source Sans 3)
- **Code/Technical:** `font-mono` (JetBrains Mono)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main layout with left rail navigation
│   ├── layout.tsx            # Root layout, font imports
│   ├── globals.css           # Tailwind v4 @theme configuration
│   └── api/
│       ├── chat/route.ts     # POST /api/chat - RAG-powered chat
│       └── recommendations/route.ts  # POST /api/recommendations
├── components/
│   ├── Sidebar.tsx           # Left rail navigation (collapsible)
│   ├── ChatInterface.tsx     # Main chat UI with ticket-stub messages
│   ├── TicketMessageBubble.tsx  # Individual message component
│   ├── VideoRecommendations.tsx  # Video recommendations display
│   ├── VideoCard.tsx         # Enhanced video card with overlays
│   ├── OnboardingModal.tsx   # First-time user setup
│   ├── ProfileModal.tsx      # User profile management
│   └── EmbeddedPlayer.tsx    # YouTube video player
├── lib/
│   ├── storage.ts            # localStorage utilities
│   ├── rag/
│   │   ├── openrouterEmbeddings.ts  # Text embeddings
│   │   └── vectorStore.ts    # ChromaDB operations
│   └── youtube/
│       ├── search.ts         # YouTube API search
│       └── types.ts          # TypeScript interfaces
└── types/
    └── user.ts               # UserProfile interface
```

## Development Commands

```bash
# Start development server
npm run dev                  # Runs on http://localhost:3000

# Build for production
npm run build

# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## Environment Variables

Create `.env.local` in the project root:

```bash
# Required for AI chat functionality
OPENROUTER_API_KEY=your_openrouter_key_here

# Required for YouTube video recommendations
YOUTUBE_API_KEY=your_youtube_api_key_here

# Required for RAG knowledge base
CHROMADB_API_KEY=your_chromadb_key_here
CHROMADB_COLLECTION=tennis_coaching
```

**Note:** Never commit `.env.local` to git. Use `.env.example` as a template.

## Key Features

1. **RAG-Powered Chat:** Retrieves relevant tennis coaching content from ITF literature
2. **Video Recommendations:** Personalized YouTube video suggestions based on user profile
3. **User Profiles:** Skill level, goals, and focus areas for personalization
4. **Collapsible Left Rail:** Space-efficient navigation
5. **Responsive Design:** Mobile-friendly (sidebar collapses, bottom nav option)

## Important Conventions

### Component Patterns
- **Ticket-Stub Design:** Messages use border-left accent with metadata header
- **Color Usage:**
  - User messages: clay-100 background, clay-400 border
  - AI messages: ausopen-50 background, ausopen-500 border
  - Active tabs/buttons: wimbledon-500 background

### State Management
- Use `useState` for local component state
- Use `localStorage` via `src/lib/storage.ts` for persistence
- Key persisted data: user profile, RAG enabled flag, sidebar collapsed state

### API Routes
- All POST endpoints
- Return JSON responses
- Handle errors gracefully with proper status codes

### Styling Rules
- **ALWAYS** use Tailwind utility classes
- **NEVER** use emoji icons - use Lucide React
- **ALWAYS** use semantic color names (clay-*, wimbledon-*, ausopen-*)
- Background gradients should be subtle (clay-50 to clay-100)

## Common Gotchas

### Tailwind CSS v4
- Uses `@theme inline` in `globals.css` (NOT tailwind.config.js)
- Custom colors defined in both `:root` and `@theme inline` blocks
- Must keep both in sync!

### Next.js 16 Breaking Changes
- App Router only (no Pages router)
- Different API route patterns
- New compilation behavior
- Always check `node_modules/next/dist/docs/` if unsure

### YouTube API
- Requires API key with quota
- Rate limiting applies
- Search results need video details API call for duration/views

### ChromaDB Cloud
- Requires persistent connection
- Collection must exist before querying
- Embeddings must match the model used for storage

## Adding New Features

### New Navigation Tab
1. Add tab to `navItems` array in `Sidebar.tsx`
2. Update `activeTab` type in `Sidebar.tsx` and `page.tsx`
3. Add corresponding route/content in `page.tsx`

### New Color Variant
1. Add CSS variables to `:root` in `globals.css`
2. Add same colors to `@theme inline` block in `globals.css`
3. Add to `colors` object in `tailwind.config.ts`

### New Modal Component
1. Create in `src/components/YourModal.tsx`
2. Use fixed positioning with z-50 or higher
3. Accept `onClose` callback prop
4. Follow existing modal patterns (onboarding, profile)

## Testing

### Manual Testing Checklist
- [ ] Chat works with RAG enabled/disabled
- [ ] Video recommendations load based on profile
- [ ] Sidebar collapses/expands smoothly
- [ ] All modals open/close correctly
- [ ] YouTube videos play in embedded player
- [ ] Profile updates persist across sessions
- [ ] Mobile responsive (test at < 768px width)

### Color Contrast
- Navy-900 on clay-50: 13.5:1 ✅ (AAA)
- Wimbledon-500 white text: 4.8:1 ✅ (AA)
- Ausopen-500 white text: 4.9:1 ✅ (AA)

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Environment Variables in Production
Set all environment variables in Vercel dashboard or your hosting platform.

## Troubleshooting

### Colors Not Updating
1. Hard refresh browser (Cmd+Shift+R)
2. Check both `:root` and `@theme inline` blocks in `globals.css`
3. Verify `tailwind.config.ts` matches
4. Clear `.next` cache: `rm -rf .next && npm run dev`

### YouTube API Quota Exceeded
- Check quota at https://console.cloud.google.com/
- Consider implementing server-side caching
- Use `maxResults` parameter to limit API calls

### ChromaDB Connection Issues
- Verify API key in `.env.local`
- Check collection name matches
- Ensure network allows outbound connections

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs) (check `node_modules/next/dist/docs/` for local copy)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev/icons/)
- [ITF Coaching & Sport Science Review](https://itfcoachingreview.com)

## Notes

- This is a client-side only application (no backend server needed beyond API routes)
- All user data stored locally in browser (localStorage)
- No authentication system currently implemented
- Designed for rapid prototyping and demonstration
