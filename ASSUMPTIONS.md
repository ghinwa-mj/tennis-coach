# Technical Assumptions & Future Work

This document tracks assumptions and shortcuts taken during development that need to be addressed later.

---

## Authentication & Data Persistence

### Current State
- **No user authentication** - anyone can access the app
- **Local storage only** - user profile stored in browser's localStorage
- **No server-side persistence** - data lost if browser cache is cleared
- **No conversation history** - chats are not saved between sessions

### Future Improvements
- [ ] Add user authentication (email/password, OAuth, or magic link)
- [ ] Implement server-side database (PostgreSQL, MongoDB, etc.)
- [ ] Store conversation history with pagination
- [ ] Sync user profile across devices
- [ ] Add account deletion and data export (GDPR compliance)

---

## Privacy & Security

### Current State
- **API key exposed in client** - .env.local is accessible in build
- **No rate limiting** - API could be abused
- **No input sanitization** - relying on API provider's safety
- **No CORS restrictions** - accepts requests from anywhere

### Future Improvements
- [ ] Move API calls to protected backend service
- [ ] Implement rate limiting per user/IP
- [ ] Add CSRF protection
- [ ] Sanitize user inputs before sending to AI
- [ ] Add content moderation for inappropriate queries

---

## AI Configuration

### Current State
- **Fixed model** - always uses claude-sonnet-4-20250514
- **Fixed temperature/parameters** - no customization
- **No streaming responses** - waits for complete response
- **Basic error handling** - generic error messages

### Future Improvements
- [ ] Add streaming responses for better UX
- [ ] Let users choose AI model/parameters
- [ ] Implement conversation context limits
- [ ] Add fallback/retry logic with exponential backoff
- [ ] Cache common responses to reduce API costs

---

## User Experience

### Current State
- **Single-page app** - no navigation between sections
- **No mobile app** - web-only (responsive but not native)
- **No offline support** - requires internet connection
- **Basic chat interface** - no rich features (voice, images, etc.)

### Future Improvements
- [ ] Add specialized sections (Backhand, Forehand, Serve, Tactics, Fitness)
- [ ] Implement mobile app (React Native or Flutter)
- [ ] Add offline mode with cached content
- [ ] Support voice input/output
- [ ] Enable image/video upload for stroke analysis
- [ ] Add drill library with video demonstrations
- [ ] Implement progress tracking and statistics

---

## Content & Knowledge Base

### Current State
- **No external knowledge base** - only AI's training data
- **No video integration** - can't analyze or reference footage
- **No coaching resources** - no imported literature or guides
- **General tennis knowledge** - not personalized to user's context

### Future Improvements
- [ ] Build RAG (Retrieval-Augmented Generation) system
- [ ] Index professional coaching videos and resources
- [ ] Import tennis literature and coaching guides
- [ ] Add video analysis capabilities (pose detection, stroke comparison)
- [ ] Create drill library with progressions
- [ ] Add tactical scenarios and match analysis tools

---

## Monitoring & Analytics

### Current State
- **No usage tracking** - can't see how users interact with app
- **No error tracking** - no visibility into issues
- **No performance monitoring** - don't know API costs or response times
- **No user feedback** - no way to collect suggestions

### Future Improvements
- [ ] Add analytics (privacy-focused, anonymized)
- [ ] Implement error tracking (Sentry, etc.)
- [ ] Monitor API costs and token usage
- [ ] Add user feedback mechanism
- [ ] Track coaching effectiveness metrics

---

## Deployment & Infrastructure

### Current State
- **Development only** - running locally on localhost:3000
- **No CI/CD** - manual deployment
- **No staging environment** - testing in production
- **No backup strategy** - data loss risk

### Future Improvements
- [ ] Deploy to production (Vercel, Netlify, etc.)
- [ ] Set up CI/CD pipeline
- [ ] Create staging environment
- [ ] Implement database backups
- [ ] Add uptime monitoring
- [ ] Create disaster recovery plan

---

## Cost Management

### Current State
- **Open API usage** - no cost controls in place
- **No usage tracking** - can't predict monthly costs
- **Single model tier** - may be overkill for simple queries

### Future Improvements
- [ ] Add per-user rate limits
- [ ] Implement token usage tracking
- [ ] Consider cheaper model for simple queries
- [ ] Set up cost alerts and budgets
- [ ] Optimize prompts to reduce token usage
