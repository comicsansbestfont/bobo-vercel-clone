# Bobo AI Chatbot

An advanced AI-powered chatbot built with Next.js, featuring multi-model support, intelligent context management, project-based organization, and RAG capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

---

## ✨ Features

- **10+ AI Models**: OpenAI (GPT-4o, GPT-5), Anthropic (Claude), Google (Gemini), Deepseek
- **Project Organization**: Organize chats into projects with custom instructions
- **RAG Support**: Upload markdown files, retrieve context via semantic search
- **Real-time Context Tracking**: Visual progress bar with token counting
- **Automatic Memory Compression**: Smart context management when approaching limits
- **Streaming Responses**: Real-time streaming with reasoning visualization
- **Web Search**: Integrated Perplexity Sonar for web-enhanced responses
- **Full Persistence**: PostgreSQL database with Supabase

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- AI Gateway API key from Vercel

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bobo-vercel-clone

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
# See docs/audits/SCHEMA_AUDIT.md for setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```bash
# Required
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get your Vercel AI Gateway key: https://vercel.com/ai/api-keys

---

## 📚 Documentation

**For comprehensive documentation, see the [docs/](docs/) folder:**

- **[docs/INDEX.md](docs/INDEX.md)** - Documentation hub (start here!)
- **[docs/README.md](docs/README.md)** - Full technical documentation
- **[docs/archive/PROGRESS_TRACKER.md](docs/archive/PROGRESS_TRACKER.md)** - Development progress & version history (archived)
- **[docs/testing/TESTING_QUICKSTART.md](docs/testing/TESTING_QUICKSTART.md)** - Testing guide

### Quick Links

| Topic | Documentation |
|-------|---------------|
| 🏗️ Architecture | [docs/README.md](docs/README.md#architecture) |
| 🗄️ Database Schema | [docs/audits/SCHEMA_AUDIT.md](docs/audits/SCHEMA_AUDIT.md) |
| 🧪 Testing | [docs/testing/TESTING_QUICKSTART.md](docs/testing/TESTING_QUICKSTART.md) |
| 📝 Backlog | [docs/product/PRODUCT_BACKLOG.md](docs/product/PRODUCT_BACKLOG.md) |
| 🐛 Bug Reports | [docs/bugs/BUG_REPORT_MESSAGE_RENDERING.md](docs/bugs/BUG_REPORT_MESSAGE_RENDERING.md) |
| 🤖 Claude Code | [CLAUDE.md](CLAUDE.md) |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui
- **AI**: Vercel AI SDK, AI Elements
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)

---

## 📊 Project Status

**Current Version:** V1.1 (Production Ready)

- ✅ **V1.0**: Core chat with persistence (100%)
- ✅ **V1.1**: Bug fixes & project pages (100%)
- ✅ **M2**: Project Intelligence - Double-Loop RAG (100%)
  - ✅ Custom instructions
  - ✅ File upload & vector search
  - ✅ Hybrid semantic search (Loop A + Loop B)
  - ✅ Inline citations with source tracking
- 📝 **M3**: User Profile & Bio (Planned)
- 📝 **M4**: Production & Scale (Planned)

See [CLAUDE.md](CLAUDE.md) for current milestone status.

---

## 🧪 Development

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test
```

See [docs/testing/TESTING_QUICKSTART.md](docs/testing/TESTING_QUICKSTART.md) for testing instructions.

---

## 📖 Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### AI SDK Resources

- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [AI Elements](https://ai-sdk.dev/elements)
- [Supabase Docs](https://supabase.com/docs)

---

## 🤝 Contributing

1. Review [docs/product/PRODUCT_BACKLOG.md](docs/product/PRODUCT_BACKLOG.md) for available tasks
2. Check [CLAUDE.md](CLAUDE.md) for current milestone status
3. Update relevant docs with your changes
4. Follow the code style and testing guidelines

---

## 📝 License

[Add your license here]

---

## 💬 Support

- **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Version History**: [docs/archive/PROGRESS_TRACKER.md](docs/archive/PROGRESS_TRACKER.md)

---

**Built with ❤️ using Next.js, Vercel AI SDK, and Supabase**
