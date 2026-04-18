<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-patterns -->
# TennisCoach AI - Project-Specific Patterns

## Design System (CRITICAL - Follow These!)

### Colors
- **ALWAYS** use semantic color names: `clay-*`, `wimbledon-*`, `ausopen-*`, `navy-*`
- **NEVER** use generic colors (red, blue, green, etc.)
- **NEVER** use default Tailwind colors (green-500, blue-500, etc.)

### Icons
- **ALWAYS** use Lucide React icons
- **NEVER** use emoji icons in components
- Import pattern: `import { IconName } from 'lucide-react'`

### Typography
- Headings: `font-heading` (Cormorant Garamond, serif)
- Body text: `font-sans` (Source Sans 3)
- Code/technical: `font-mono` (JetBrains Mono)

### Component Patterns
1. **Left Rail Navigation** (NOT sidebar):
   - Collapsed: 64px width
   - Expanded: 240px width
   - State persisted to localStorage

2. **Ticket-Stub Messages**:
   - Border-left accent (4px)
   - Metadata header with timestamp
   - Rounded corners (rounded-lg)

3. **Active States**:
   - Use `wimbledon-500` for active tabs/buttons
   - Hover: `wimbledon-600`

4. **AI Elements**:
   - Use `ausopen-500` for AI-related elements
   - Background: `ausopen-50`

## File Structure Rules

### Adding New Components
- Place in `src/components/`
- Use TypeScript interfaces for props
- Follow naming convention: PascalCase
- Export as: `export default function ComponentName()`

### Adding New API Routes
- Place in `src/app/api/your-route/route.ts`
- Use named exports: `export async function POST()`
- Return JSON responses
- Handle errors with proper HTTP status codes

### Styling Rules
- **ALWAYS** use Tailwind utility classes
- Check `src/app/globals.css` for custom colors
- If color doesn't exist, add to:
  1. `:root` block in `globals.css`
  2. `@theme inline` block in `globals.css`
  3. `tailwind.config.ts` colors object
<!-- END:project-patterns -->

<!-- BEGIN:safety-rules -->
# Safety Rules - DO NOT BREAK THESE

## Git Operations
- **NEVER** run `git push --force` without explicit user permission
- **NEVER** delete branches without asking first
- **ALWAYS** check current branch before making changes
- **NEVER** commit sensitive data (API keys, .env files)

## File Operations
- **NEVER** delete `node_modules/` without user confirmation
- **NEVER** modify `.env.local` without asking
- **NEVER** delete `.git` directory
- **ALWAYS** verify file paths before making changes

## Destructive Commands
- **ALWAYS** show the command before running it
- **NEVER** run `rm -rf` without confirmation
- **NEVER** modify database schemas without backing up
- **NEVER** clear caches without explaining why

## Testing
- **ALWAYS** test on mobile viewport (< 768px)
- **ALWAYS** check color contrast ratios
- **NEVER** assume responsive design works without testing
<!-- END:safety-rules -->

<!-- BEGIN:framework-guidelines -->
# Framework-Specific Guidelines

## Tailwind CSS v4
- Uses `@theme inline` configuration in `src/app/globals.css`
- Custom colors defined in BOTH `:root` and `@theme inline` blocks
- MUST keep both blocks in sync
- Refer to `tailwind.config.ts` for custom color mappings

## React/Next.js
- Use Client Components for interactivity (`'use client'`)
- Use Server Components by default (no directive)
- State management: `useState` for local state
- Persistence: Use `src/lib/storage.ts` for localStorage

## TypeScript
- **ALWAYS** define prop interfaces
- **NEVER** use `any` type
- Use proper typing for API responses
- Import types: `import type { TypeName } from 'path'`

## API Integration
- All API routes are POST endpoints
- Use fetch() with proper error handling
- Return JSON with consistent structure
- Handle loading states in UI
<!-- END:framework-guidelines -->

<!-- BEGIN:task-execution -->
# Task Execution Guidelines

## Before Making Changes
1. **READ** existing code to understand patterns
2. **CHECK** if similar functionality already exists
3. **VERIFY** your approach matches project conventions
4. **ASK** if you're unsure about patterns

## When Exploring Codebase
- Start with `CLAUDE.md` for project overview
- Check `src/app/globals.css` for available colors
- Look at similar components for patterns
- Read type definitions in `src/types/`

## When Implementing Features
1. Plan the approach first
2. Identify which files need changes
3. Follow existing component patterns
4. Use project's color system
5. Test responsive behavior
6. Verify color contrast

## Common Mistakes to Avoid
- Don't use emoji icons (use Lucide React)
- Don't use generic color names (use semantic colors)
- Don't break the clay theme design system
- Don't forget about mobile responsiveness
- Don't ignore TypeScript errors
- Don't skip checking existing patterns
<!-- END:task-execution -->
