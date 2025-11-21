# Bobo Vercel Clone - AI Chatbot

## Project Overview

An advanced AI-powered chatbot built with Next.js, Vercel AI SDK, and AI Elements, featuring multi-model support, intelligent context management, and compression capabilities.

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

## File Structure

```
ai-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Main chat endpoint with custom streaming
│   │   └── memory/
│   │       └── compress/
│   │           └── route.ts      # Memory compression endpoint
│   ├── page.tsx                   # Main chatbot UI
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── components/
│   ├── ai-elements/               # AI Elements components
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── context-tracker.ts         # Token tracking and context monitoring
│   ├── memory-manager.ts          # Compression and summarization logic
│   └── utils.ts                   # Utility functions
├── docs/
│   ├── README.md                  # This file
│   ├── changelog.md               # Version history
│   ├── product-backlog.md         # Future enhancements
│   └── agents.md                  # AI agent guidelines
└── .env.local                     # Environment variables (AI_GATEWAY_API_KEY)
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

## Future Enhancements

See `product-backlog.md` for planned features including:
- Vector-based context retrieval (RAG)
- SuperMemory.ai integration for long-term memory
- Background/async compression
- Persistent conversation storage
- Advanced token visualization

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

