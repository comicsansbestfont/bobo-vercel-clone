# Changelog

> **DEPRECATED:** This changelog is no longer actively maintained.
>
> **For current version history and detailed progress, see [PROGRESS_TRACKER.md](PROGRESS_TRACKER.md)**
>
> PROGRESS_TRACKER provides comprehensive session logs, milestone completion dates, and feature tracking. The content below is preserved for historical reference only.

---

All notable changes to the Bobo Vercel Clone AI Chatbot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js 16.0.3
- AI Elements integration for chat UI components
- Vercel AI Gateway integration with multi-model support
- Real-time context monitoring with visual progress bar
- Intelligent memory compression using sliding window strategy
- Custom stream handler to preserve reasoning for all models (not just OpenAI)
- Precise token counting using gpt-tokenizer
- Color-coded context warnings (green/yellow/red at 70%/90% thresholds)
- Model selector with 10 AI models:
  - OpenAI: GPT-4o, GPT-5 Pro, GPT-5 Mini, GPT-5.1 Thinking, GPT-5.1 Instant
  - Anthropic: Claude Sonnet 4.5, Claude Opus 4
  - Google: Gemini 3 Pro Preview, Gemini 2.5 Flash
  - Deepseek: Deepseek R1
- Web search toggle using Perplexity Sonar
- File attachment support
- Source citation display
- Reasoning visualization for thinking models
- Message actions (copy, retry, regenerate)
- Auto-compression API endpoint (`/api/memory/compress`)
- Product backlog documentation
- Comprehensive project documentation
- **Project pages with chat list table** (2025-01-23)
  - Dynamic project routing at `/project/[projectId]`
  - Conditional rendering: chat list when no chatId, full chat interface when chatId present
  - Sortable data table using @kibo-ui/table component
  - Table columns: Chat Title, Model, Last Updated
  - Clickable table rows for chat navigation
  - Project header with editable name
  - Empty state for projects with no chats
  - Settings & Files link in project header

### Changed
- Migrated from direct OpenAI provider to Vercel AI Gateway
- Updated model identifiers to match Gateway conventions
- Enhanced context tracker with segmented token analysis
- Improved UI with tooltip explanations
- Fixed TypeScript errors in AI Elements confirmation component
- **Enhanced TableCell component** (2025-01-23)
  - Added support for HTML attributes including onClick
  - Enables clickable table cells without wrapper elements
  - File: `components/kibo-ui/table/index.tsx`

### Fixed
- npm cache permission issues during initial setup
- Tailwind CSS build error (removed invalid tw-animate-css import)
- TypeScript type mismatches in AI Elements components
- Context monitor string template errors
- Memory manager array spreading TypeScript issues
- API route streaming to preserve reasoning for all models
- **Critical: Message text split into individual words** (2025-01-23)
  - Root cause: Each streaming delta created separate message part
  - Impact: OpenAI model responses rendered with each word on separate line
  - Solution: Modified streaming handler to concatenate deltas into single text part
  - Files modified: `app/api/chat/route.ts` (lines 261-316)
  - Note: Fix applies to new messages only; existing messages remain affected

### Security
- Environment variable validation for AI_GATEWAY_API_KEY
- Error handling in API routes
- Input validation in compression logic

## [0.1.0] - 2024-11-21

### Added
- Initial release
- Project scaffolding with create-next-app
- Basic chatbot functionality
- AI Elements component library setup

---

## How to Update This Changelog

**Every commit should update this changelog with relevant changes.**

### Categories
- **Added**: New features
- **Changed**: Changes to existing functionality  
- **Deprecated**: Soon-to-be-removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Format
```markdown
### [Category]
- Brief description of change
- Link to issue/PR if applicable
- Credit contributors: @username
```

### When to Update
- Before every commit
- After completing a feature
- When fixing bugs
- During code reviews

### Version Numbering
- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features, backward-compatible
- **Patch (0.0.X)**: Bug fixes, backward-compatible

