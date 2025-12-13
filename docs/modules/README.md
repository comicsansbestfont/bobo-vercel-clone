# Bobo Platform - Module Architecture

## Overview

Bobo is a sophisticated AI chatbot platform evolving into a multi-module "Second Brain" system. The platform is organized into three distinct module types, each serving a specific architectural purpose.

## Architecture Principles

### Modular Design
The platform follows a layered modular architecture where:
- **Infrastructure modules** provide core technical capabilities
- **Knowledge modules** organize domain-specific information
- **Use case modules** orchestrate infrastructure and knowledge for end-user workflows

### Separation of Concerns
Each module maintains clear boundaries:
- Infrastructure modules are technology-focused and domain-agnostic
- Knowledge modules are content-focused with fixed project IDs
- Use case modules are workflow-focused and user-facing

## Module Types

### 1. Infrastructure Modules (INF)
**Purpose**: Core technical capabilities that power the platform

Infrastructure modules provide reusable, domain-agnostic services:
- Multi-model chat streaming
- Context management and compression
- Retrieval-augmented generation (RAG)
- Agent tooling and execution

**Characteristics**:
- Technology-focused
- Stateless or internally stateful
- Reusable across all use cases
- No domain-specific logic

**Module ID Format**: `INF-XXX`

**Examples**:
- Chat Engine (INF-001)
- Memory System (INF-002)
- Retrieval/RAG (INF-003)
- Agent SDK (INF-004)

### 2. Knowledge Modules (KNO)
**Purpose**: Organized repositories of domain-specific information

Knowledge modules are content libraries with:
- Fixed project UUIDs in the database
- Dedicated file system directories
- Specialized indexing and retrieval
- Domain-specific search tools

**Characteristics**:
- Content-focused
- Read-only during runtime
- Embedded and indexed
- Accessed via specialized tools

**Module ID Format**: `KNO-XXX`

**Examples**:
- Advisory Library (KNO-001) - Deal and client context
- Inspiration Library (KNO-002) - Industry thought leadership
- Reference Library (KNO-003) - Personal identity and playbooks

### 3. Use Case Modules (USE)
**Purpose**: End-user workflows that orchestrate infrastructure and knowledge

Use case modules deliver specific business value by:
- Combining infrastructure capabilities
- Accessing relevant knowledge modules
- Defining user-facing workflows
- Implementing domain logic

**Characteristics**:
- Workflow-focused
- User-facing
- Orchestrates other modules
- Delivers business value

**Module ID Format**: `USE-XXX`

**Status Levels**:
- **Live**: Production-ready, actively used
- **Designed**: Architecture complete, implementation pending
- **Planned**: Concept stage, requirements gathering

**Examples**:
- Advisory Workflow (USE-001) - GTM advisory consulting
- Deal Workspace (USE-002) - Multi-deal management
- Content Studio (USE-003) - LinkedIn content creation

## Module Dependencies

```
Use Case Modules
       ↓
Infrastructure Modules ←→ Knowledge Modules
       ↓                        ↓
   Database, APIs        File System, Embeddings
```

### Dependency Rules
1. Use case modules MAY depend on infrastructure and knowledge modules
2. Infrastructure modules MUST NOT depend on knowledge or use case modules
3. Knowledge modules MAY depend on infrastructure (for indexing, retrieval)
4. Circular dependencies are prohibited

## Module Registry

The complete module manifest is maintained in [`REGISTRY.md`](./REGISTRY.md).

## Adding New Modules

### Infrastructure Module Checklist
- [ ] Define module ID (`INF-XXX`)
- [ ] Create module directory under `lib/` or `app/api/`
- [ ] Document public API and interfaces
- [ ] Add to module registry
- [ ] Create module documentation in `docs/modules/infrastructure/`

### Knowledge Module Checklist
- [ ] Define module ID (`KNO-XXX`)
- [ ] Assign fixed project UUID
- [ ] Create directory structure
- [ ] Implement indexing script (`scripts/index-*.ts`)
- [ ] Implement verification script (`scripts/verify-*-indexing.ts`)
- [ ] Add specialized search tools to `lib/ai/claude-advisory-tools.ts`
- [ ] Add to module registry
- [ ] Create module documentation in `docs/modules/knowledge/`

### Use Case Module Checklist
- [ ] Define module ID (`USE-XXX`)
- [ ] Document user workflows
- [ ] Identify infrastructure dependencies
- [ ] Identify knowledge dependencies
- [ ] Define status (Planned/Designed/Live)
- [ ] Add to module registry
- [ ] Create module documentation in `docs/modules/use-cases/`

## Related Documentation

- [Module Registry](./REGISTRY.md) - Complete module manifest
- [Infrastructure Modules](./infrastructure/) - Technical capability documentation
- [Knowledge Modules](./knowledge/) - Content library documentation
- [Use Case Modules](./use-cases/) - Workflow documentation
- [CLAUDE.md](../../CLAUDE.md) - Project overview and development guide
