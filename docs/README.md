# Bobo Documentation

**Platform**: Bobo - AI-Powered Second Brain
**Version**: M4+ (December 2025)

---

## Quick Navigation

| I want to... | Go to |
|--------------|-------|
| Understand the platform vision | [docs/product/PLATFORM_BRIEF.md](product/PLATFORM_BRIEF.md) |
| See current sprint tasks | [docs/product/PRODUCT_BACKLOG.md](product/PRODUCT_BACKLOG.md) |
| Understand module architecture | [docs/modules/README.md](modules/README.md) |
| Find a specific module | [docs/modules/REGISTRY.md](modules/REGISTRY.md) |
| Read development guidelines | [CLAUDE.md](../CLAUDE.md) |

---

## Documentation Structure

```
docs/
├── product/                 # Strategic planning & vision
│   ├── PLATFORM_BRIEF.md    # Platform vision and capabilities
│   ├── PRODUCT_BACKLOG.md   # Sprint tasks and milestones
│   ├── research/            # Background research
│   ├── roadmaps/            # Implementation plans
│   └── decisions/           # Architecture decision records
│
├── modules/                 # Module architecture & specs
│   ├── README.md            # Module types and principles
│   ├── REGISTRY.md          # Complete module manifest
│   ├── infrastructure/      # INF-XXX: Core capabilities
│   ├── knowledge/           # KNO-XXX: Content libraries
│   └── use-cases/           # USE-XXX: User workflows
│
├── sprints/                 # Sprint history
├── archive/                 # Deprecated documentation
└── README.md                # This file
```

---

## Module Overview

### Infrastructure (Core Capabilities)
| Module | Purpose |
|--------|---------|
| [INF-001: Chat Engine](modules/infrastructure/chat-engine.md) | Multi-model streaming chat |
| [INF-002: Memory System](modules/infrastructure/memory-system.md) | Context compression |
| [INF-003: Retrieval/RAG](modules/infrastructure/retrieval-system.md) | Hybrid search |
| [INF-004: Agent SDK](modules/infrastructure/agent-infrastructure.md) | Tool execution |

### Knowledge (Content Libraries)
| Module | Files | Purpose |
|--------|-------|---------|
| [KNO-001: Advisory](modules/knowledge/advisory-library.md) | 43 | Deal/client context |
| [KNO-002: Inspiration](modules/knowledge/inspiration-library.md) | 741 | Thought leadership |
| [KNO-003: Reference](modules/knowledge/reference-library.md) | 213 | Personal identity |

### Use Cases (Workflows)
| Module | Status | Purpose |
|--------|--------|---------|
| [USE-001: Advisory Workflow](modules/use-cases/advisory-workflow.md) | Live | GTM advisory consulting |
| [USE-002: Deal Workspace](modules/use-cases/deal-workspace.md) | Designed | Multi-deal management |
| [USE-003: Content Studio](modules/use-cases/content-studio.md) | Planned | Content creation |

---

## Current Focus (December 2025)

- **Active**: Advisory workflow dogfooding
- **Designed**: Deal Workspace (HubSpot-style UI)
- **Planned**: Content Studio

See [PRODUCT_BACKLOG.md](product/PRODUCT_BACKLOG.md) for detailed sprint tracking.

---

*Last Updated: December 13, 2025*
