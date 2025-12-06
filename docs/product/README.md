# Bobo Product Documentation

This folder contains all product-related documentation for Bobo - the "Second Brain" platform.

## Document Hierarchy

```
docs/product/
├── PLATFORM_BRIEF.md         # Platform vision, capabilities, and milestones
├── PRODUCT_BACKLOG.md        # Operational sprint-level task tracking
├── README.md                 # This file
│
├── use-cases/                # How Bobo is used (vertical applications)
│   └── ADVISORY_WORKFLOW.md  # Deals & Clients management (primary dogfooding)
│
└── roadmaps/                 # Detailed implementation plans
    ├── REPOSITORY_CONSOLIDATION.md  # Blog Migration → Bobo consolidation
    ├── COGNITIVE_MEMORY.md          # Neuroscience-inspired memory system
    ├── KNOWLEDGE_MIGRATION.md       # Original sync-based approach (superseded)
    └── SEEDING_STRATEGY.md          # Memory seeding approach
```

## Quick Reference

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **PLATFORM_BRIEF.md** | High-level vision, architecture, milestones | Understanding what Bobo is |
| **PRODUCT_BACKLOG.md** | Sprint planning, task tracking | Day-to-day development |
| **ADVISORY_WORKFLOW.md** | Deals/clients use case details | Working on advisory features |
| **REPOSITORY_CONSOLIDATION.md** | File migration roadmap | Implementing M3.7 |
| **COGNITIVE_MEMORY.md** | Memory system requirements | Implementing M3.6 |

## Platform Layers

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASES     │ Advisory │ Content │ Knowledge │ Future   │
├────────────────┼──────────┼─────────┼───────────┼──────────┤
│  CAPABILITIES  │   Chat   │ Memory  │    RAG    │  Agent   │
├────────────────┼──────────┴─────────┴───────────┴──────────┤
│  INFRASTRUCTURE │        Supabase + Git Files              │
└─────────────────────────────────────────────────────────────┘
```

## Current Focus (December 2025)

- **M3.6:** Cognitive Memory System (temporal decay, Hebbian reinforcement)
- **M3.7:** Repository Consolidation (bring advisory files into Bobo)
- **Dogfooding:** Advisory workflow with deals/clients

## Related Documentation

- `/docs/brain-building/` - Research on neuroscience-inspired memory
- `/docs/sprints/` - Historical sprint documentation
- `/docs/specs/` - Technical specifications
- `/CLAUDE.md` - Codebase guide for Claude Code

---

*Last Updated: December 6, 2025*
