# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint

# Database
npx prisma db push   # Push schema changes to database
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma studio    # Open Prisma Studio GUI
npx ts-node src/lib/seed.ts  # Seed test data
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string (pooled, for app)
- `DIRECT_URL` - PostgreSQL direct connection (for migrations)
- `LLM_PROVIDER` - "openai" or "anthropic"
- `LLM_API_KEY` - API key for the LLM provider
- `LLM_MODEL` - Model name (e.g., "gpt-4o-mini", "glm-5", "claude-3-haiku-20240307")
- `CRON_SECRET` - Bearer token for API authentication

## Architecture Overview

### Data Flow
```
RSS Sources → fetcher.ts → Database (pending) → summarizer.ts → Database (processed) → Frontend
```

### Core Modules (`src/lib/`)

- **sources.ts** - RSS feed configurations (OpenAI, DeepMind, MIT Tech Review, etc.)
- **fetcher.ts** - Fetches articles from RSS feeds, saves to DB with status "pending"
- **summarizer.ts** - Processes pending articles via LLM, generates:
  - Bilingual titles (titleZh/titleEn)
  - Three summary levels per language: core, simple (general readers), deep (developers)
  - Difficulty rating (beginner/general/advanced)
  - Auto-generated tags
- **db.ts** - Prisma client singleton

### API Routes (`src/app/api/`)

- **GET /api/fetch** - Fetch new articles from RSS sources
- **POST /api/fetch** - Process pending articles with LLM (body: `{ batchSize?: number }`)
- **GET /api/articles** - List processed articles (params: page, limit, difficulty, tag, status)

Both `/api/fetch` endpoints require `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.

### Database Schema (Prisma)

```
Source (1) ──< Article (N)
Article (N) >──< Tag (N)  via ArticleTag
```

Article statuses: `pending` → `processed` → `featured`

### Frontend

- **page.tsx** - Server component, fetches articles/tags, passes to ClientPage
- **ClientPage.tsx** - Client-side filtering by difficulty and tags, language toggle (zh/en)
- Supports bilingual display with fallback logic (e.g., titleZh falls back to original title)

## LLM Integration

The summarizer supports multiple providers:
- OpenAI API (default)
- Zhipu AI / GLM models (auto-detected by model name containing "glm")
- Anthropic Claude

Without an API key configured, the system returns placeholder text instead of actual summaries.
