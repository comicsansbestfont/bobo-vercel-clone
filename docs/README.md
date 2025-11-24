# Bobo AI Chatbot - Documentation Index

**Version:** v1.2.0 (M2 Complete)
**Last Updated:** November 24, 2025

---

## 🗺️ Quick Navigation

**New to the project?** Start here:
- [PROJECT_BRIEF.md](PROJECT_BRIEF.md) - Product vision, features, architecture (v2.2, 773 lines)
- [context-memory-vision.md](context-memory-vision.md) - Core architecture philosophy

**Working on tasks?** Check these:
- [Sprint M3-01](sprints/active/sprint-m3-01.md) - Current sprint (Personal Context Foundation)
- [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) - All planned features by milestone
- [Sprint Management](sprints/README.md) - Sprint history, metrics, and planning

**Deploying or debugging?**
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [M2 Completion Report](reports/M2_COMPLETION_SUMMARY.md) - Latest milestone summary
- [changelog.md](changelog.md) - Release notes and version history

---

## Project Overview

An advanced AI-powered chatbot built with Next.js 16, React 19, and the Vercel AI SDK. Features multi-model support, intelligent context management, Double-Loop RAG architecture, and Perplexity-style inline citations.

### Current Status (M2 Complete)
- ✅ **V1**: Full persistence layer with Supabase
- ✅ **M2**: Double-Loop RAG with project context caching + global hybrid search
- 🚧 **M3**: User Profile & Bio Memory (Sprint M3-01 in progress)
- 📝 **M4**: Production & Scale (planned Q2 2025)
- 📝 **M5**: Cognitive Layer - Living docs & knowledge graph (planned Q3 2025)

## Project Brief

### Vision
Build a production-ready AI chatbot that rivals tools like Claude and Cursor, with sophisticated context management, memory compression, and support for multiple AI models through Vercel AI Gateway.

### Core Features

#### 1. Multi-Model Support
- **OpenAI Models**: GPT-4o, GPT-5 Pro, GPT-5 Mini, GPT-5.1 Thinking, GPT-5.1 Instant
- **Anthropic Models**: Claude Sonnet 4.5, Claude Opus 4
- **Google Models**: Gemini 3 Pro Preview, Gemini 2.5 Flash
- **Deepseek Models**: Deepseek R1
- **Web Search**: Perplexity Sonar integration

#### 2. Intelligent Context Management
- **Real-time Token Tracking**: Precise token counting using gpt-tokenizer
- **Visual Context Monitor**: Progress bar with color-coded warnings
  - Green: < 70% usage (safe)
  - Yellow: 70-90% usage (warning)
  - Red: > 90% usage (critical)
- **Segmented Display**: Shows token usage breakdown by System/History/Current Input
- **Model-Specific Limits**: Accurate context windows per model (128k - 2M tokens)

#### 3. Automatic Memory Compression
- **Sliding Window Strategy**: Preserves recent messages, summarizes older content
- **Just-in-Time Compression**: Triggers automatically at 90% token usage
- **Smart Preservation**: Always keeps system prompts and last 4 messages intact
- **Cost-Optimized**: Uses GPT-4o-mini for summarization to minimize API costs

#### 4. Advanced UI Features
- **File Attachments**: Upload and send files with messages
- **Web Search Toggle**: Enable/disable web search per message
- **Model Switcher**: Live model switching during conversation
- **Reasoning Display**: Expandable reasoning sections for thinking models
- **Source Citations**: Automatic citation display for web search results
- **Message Actions**: Copy, retry, and regenerate responses

## Technical Stack

### Frontend
- **Framework**: Next.js 16.0.3 with App Router
- **UI Library**: AI Elements + shadcn/ui
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks + @ai-sdk/react
- **Icons**: Lucide React

### Backend
- **API Routes**: Next.js API routes with streaming support
- **AI Integration**: Vercel AI SDK with AI Gateway
- **Token Management**: gpt-tokenizer for accurate counting
- **Memory Management**: Custom compression and summarization logic

### Dependencies
```json
{
  "ai": "^5.0.98",
  "@ai-sdk/react": "^2.0.98",
  "gpt-tokenizer": "latest",
  "next": "16.0.3",
  "react": "19.2.0",
  "zod": "^4.1.12"
}
```

## Architecture

### Chat Flow
```
User Input → PromptInput Component
    ↓
Context Check (lib/context-tracker.ts)
    ↓
Compression Check (if >90% tokens)
    ↓
Memory Compression (lib/memory-manager.ts)
    ↓
API Request (/api/chat)
    ↓
Vercel AI Gateway
    ↓
Model Response (Stream)
    ↓
UI Update (Conversation Component)
```

### Context Management Flow
```
Messages → Token Counter → Context Monitor
                ↓
            > 90% threshold?
                ↓ yes
    Compression Trigger → /api/memory/compress
                ↓
    Summary Generation (GPT-4o-mini)
                ↓
    Replace old messages with summary
                ↓
    Continue conversation
```

## Documentation Structure

```
docs/
├── README.md                      # This file - Documentation index
├── PROJECT_BRIEF.md               # Product vision & specifications (v2.2)
├── PRODUCT_BACKLOG.md             # Sprint planning & milestone tasks
├── context-memory-vision.md       # Architecture philosophy (Knowledge/Context/Cognitive layers)
├── DEPLOYMENT_CHECKLIST.md        # Production deployment checklist
├── changelog.md                   # Release notes and version history
├── sprints/                       # Sprint management system
│   ├── README.md                  # Sprint index & metrics
│   ├── active/                    # Current sprint(s)
│   │   └── sprint-m3-01.md        # M3 Week 1 - Personal Context Foundation
│   ├── completed/                 # Completed sprints
│   │   ├── sprint-v1-01.md        # V1 - Persistence Layer
│   │   ├── sprint-v1-02.md        # V1.2 - Polish & Testing
│   │   └── sprint-m2-01.md        # M2 - Double-Loop RAG
│   └── templates/                 # Sprint templates
│       └── sprint-template.md     # Standard sprint format
├── reports/                       # Completion summaries & test reports
│   ├── README.md                  # Reports index
│   ├── M2_COMPLETION_SUMMARY.md   # M2 final report
│   ├── M2_CITATION_TEST_REPORT.md # M2 citation testing
│   └── M2_CITATION_BUGS.md        # M2 bug tracking
└── archive/                       # Deprecated documentation
    ├── README.md                  # Archive index
    ├── PROGRESS_TRACKER.md        # (superseded by sprints)
    ├── INDEX.md                   # (superseded by this README)
    └── product-roadmap.md         # (superseded by PRODUCT_BACKLOG)
```

## Project Structure

```
bobo-vercel-clone/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Main chat endpoint with Loop A+B RAG
│   │   ├── memory/compress/       # Memory compression endpoint
│   │   ├── projects/              # Project CRUD + file upload
│   │   └── chats/                 # Chat management
│   ├── page.tsx                   # Main chatbot UI
│   ├── project/[id]/page.tsx      # Project view
│   └── settings/                  # Settings pages
├── components/
│   ├── ai-elements/               # AI Elements (citations, reasoning, etc.)
│   ├── ui/                        # shadcn/ui components
│   ├── chat/                      # Chat interface components
│   └── project/                   # Project management UI
├── lib/
│   ├── ai/                        # M2 Double-Loop RAG system
│   │   ├── context-manager.ts     # Loop A - Project context caching
│   │   ├── embedding.ts           # Embedding generation (OpenAI)
│   │   └── source-tracker.ts      # Citation tracking & insertion
│   ├── db/                        # Database layer
│   │   ├── client.ts              # Supabase client
│   │   ├── queries.ts             # All database queries
│   │   └── types.ts               # TypeScript types
│   ├── context-tracker.ts         # Token tracking
│   └── memory-manager.ts          # Compression logic
├── docs/                          # (see structure above)
├── tests/
│   └── e2e/                       # Playwright E2E tests
│       ├── chat-creation.spec.ts
│       ├── project-chat-creation.spec.ts
│       ├── chat-persistence.spec.ts
│       └── m2-citations.spec.ts
├── supabase/
│   └── migrations/                # Database migrations
└── .env.local                     # Environment variables
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd ai-chatbot
npm install
```

### 2. Configure Environment
Create `.env.local` with your Vercel AI Gateway key:
```bash
AI_GATEWAY_API_KEY=your_key_here
```
Get your key from: https://vercel.com/ai/api-keys

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

## Key Features Explained

### Context Monitor
The context monitor displays real-time token usage with a visual progress bar. It shows:
- Current token count vs. model limit
- Percentage usage
- Color-coded warnings (green/yellow/red)
- Tooltip with breakdown by segment

### Memory Compression
When token usage exceeds 90%, the system automatically:
1. Preserves the system prompt and last 4 messages
2. Sends middle messages to GPT-4o-mini for summarization
3. Replaces old messages with a concise summary
4. Updates the UI with "Memory Compressed" badge
5. Continues the conversation seamlessly

### Reasoning Display
For thinking models (GPT-5.1-thinking, Claude Sonnet 4.5, Gemini), the UI displays:
- Expandable reasoning section
- Real-time streaming of thought process
- Collapsible view to reduce clutter

## Configuration

### Model Limits
Defined in `lib/context-tracker.ts`:
- GPT models: 128k - 200k tokens
- Claude models: 200k tokens
- Gemini models: 1M - 2M tokens
- Deepseek: 128k tokens

### Compression Settings
Defined in `lib/memory-manager.ts`:
- Threshold: 90% of context limit
- Recent messages preserved: 4
- Summarization model: gpt-4o-mini

## Development Guidelines

### Adding New Models
1. Add model to `models` array in `app/page.tsx`
2. Add context limit to `MODEL_CONTEXT_LIMITS` in `lib/context-tracker.ts`
3. Test with sample conversations

### Modifying Compression Logic
1. Update `RECENT_MESSAGE_COUNT` in `lib/memory-manager.ts`
2. Adjust threshold calculation in `lib/context-tracker.ts`
3. Test with long conversations

## Known Issues & Limitations

### Current Limitations
- Reasoning parts may not display for all non-OpenAI models due to SDK validation
- Token counting is approximate for non-text message parts (images, files)
- Compressed history cannot be "uncompressed" (summaries are lossy)

### Workarounds
- Custom stream handler bypasses SDK reasoning validation
- Heuristic token counting for attachments
- Keep original messages in localStorage for reference

## Current & Upcoming Work

**Active Sprint:** [M3-01 - Personal Context Foundation](sprints/active/sprint-m3-01.md) (Nov 24-30, 2025)
- Personal profile schema & settings UI
- "About You" profile injection into chat prompts
- Memory schema definition for fact categorization

**Future Milestones:**
- **M3 (3 weeks)**: Supermemory.ai integration, memory management UI, runtime context
- **M4 (4+ weeks)**: Authentication, multi-user, team workspaces, analytics
- **M5 (TBD)**: Living documentation, hierarchical summaries, knowledge graph

See [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) for full task breakdown and [Sprint Management](sprints/README.md) for sprint planning.

## Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [AI Gateway Documentation](https://vercel.com/docs/ai-gateway)
- [AI Elements Components](https://ai-sdk.dev/elements)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues or questions:
1. Check the changelog for recent changes
2. Review the product backlog for planned features
3. Consult the agents.md for AI assistant guidelines

