# Memory System Analysis: Neuroscience Foundations & Implementation Recommendations

**Research Report v1.0**
**Date:** November 28, 2025
**Authors:** AI Architecture Team
**Status:** Draft for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Introduction & Objectives](#2-introduction--objectives)
3. [Biological Memory Systems: A Deep Dive](#3-biological-memory-systems-a-deep-dive)
   - 3.1 [Memory Formation & Encoding](#31-memory-formation--encoding)
   - 3.2 [Memory Types & Taxonomy](#32-memory-types--taxonomy)
   - 3.3 [Memory Consolidation](#33-memory-consolidation)
   - 3.4 [Memory Retrieval Mechanisms](#34-memory-retrieval-mechanisms)
   - 3.5 [Forgetting & Memory Maintenance](#35-forgetting--memory-maintenance)
4. [Neural Network Approaches to Memory](#4-neural-network-approaches-to-memory)
   - 4.1 [Attention Mechanisms](#41-attention-mechanisms)
   - 4.2 [Memory-Augmented Neural Networks](#42-memory-augmented-neural-networks)
   - 4.3 [Retrieval-Augmented Generation](#43-retrieval-augmented-generation)
   - 4.4 [Relevant Research & Models](#44-relevant-research--models)
5. [Current Implementation Analysis](#5-current-implementation-analysis)
   - 5.1 [Architecture Overview](#51-architecture-overview)
   - 5.2 [Schema & Data Model](#52-schema--data-model)
   - 5.3 [Retrieval Mechanisms](#53-retrieval-mechanisms)
   - 5.4 [Memory Tools](#54-memory-tools)
6. [Gap Analysis: Biology vs Implementation](#6-gap-analysis-biology-vs-implementation)
   - 6.1 [Temporal Dynamics](#61-gap-1-temporal-dynamics)
   - 6.2 [Associative Networks](#62-gap-2-associative-networks)
   - 6.3 [Memory Type Distinction](#63-gap-3-memory-type-distinction)
   - 6.4 [Consolidation Processes](#64-gap-4-consolidation-processes)
   - 6.5 [Context-Dependent Retrieval](#65-gap-5-context-dependent-retrieval)
   - 6.6 [Hebbian Reinforcement](#66-gap-6-hebbian-reinforcement)
   - 6.7 [Working Memory](#67-gap-7-working-memory)
   - 6.8 [Emotional Salience](#68-gap-8-emotional-salience)
   - 6.9 [Hierarchical Organization](#69-gap-9-hierarchical-organization)
   - 6.10 [Iterative Retrieval](#610-gap-10-iterative-retrieval)
7. [Recommendations](#7-recommendations)
   - 7.1 [Tier 1: Critical Improvements](#71-tier-1-critical-improvements)
   - 7.2 [Tier 2: Major Enhancements](#72-tier-2-major-enhancements)
   - 7.3 [Tier 3: Advanced Features](#73-tier-3-advanced-features)
8. [Implementation Specifications](#8-implementation-specifications)
9. [References](#9-references)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

This report presents a comprehensive analysis of Bobo's memory system through the lens of cognitive neuroscience and modern neural network research. Our goal is to identify opportunities to create a more biologically-inspired memory architecture that better mirrors how human memory actually functions.

### Key Findings

**Current State:**
- The existing implementation provides a functional hybrid search system (70% vector + 30% BM25)
- Memory is treated as a static database with flat categorical organization
- Retrieval is single-pass and context-independent
- No temporal dynamics, consolidation, or associative mechanisms

**Critical Gaps:**
1. **No temporal decay** — all memories weighted equally regardless of recency or access frequency
2. **No spreading activation** — missing associative retrieval that mirrors human recall
3. **No memory consolidation** — memories are stored but never refined or integrated
4. **Context-blind retrieval** — same results regardless of conversational context
5. **Duplicate rejection vs reinforcement** — near-matches are rejected instead of strengthened

**Impact Assessment:**
These gaps result in a memory system that:
- Cannot prioritize recent or frequently-accessed information
- Misses semantically-related but not directly-matching memories
- Accumulates redundant entries without synthesis
- Fails to leverage conversational context for relevance

### Recommended Path Forward

| Priority | Enhancement | Effort | Impact |
|----------|-------------|--------|--------|
| P0 | Temporal weighting (recency + frequency) | 4-6h | Critical |
| P0 | Hebbian reinforcement on near-match | 2-3h | Critical |
| P1 | Context-aware retrieval | 4-6h | High |
| P1 | Memory consolidation job | 8-12h | High |
| P2 | Memory graph + spreading activation | 12-16h | High |
| P2 | Episodic → Semantic transformation | 6-8h | Medium |

---

## 2. Introduction & Objectives

### 2.1 Purpose

This research report serves as the foundational document for evolving Bobo's memory system from a search-oriented database into a cognitively-inspired memory architecture. The goal is not to perfectly replicate biological memory—which is neither possible nor necessary—but to adopt key principles that make human memory remarkably effective:

- **Adaptive forgetting**: Not all information deserves equal retention
- **Associative recall**: Related concepts activate together
- **Context sensitivity**: Memory retrieval is state-dependent
- **Continuous refinement**: Memories consolidate and abstract over time

### 2.2 Scope

This analysis covers:
- Relevant neuroscience research on human memory systems
- Computational models inspired by biological memory
- Detailed analysis of the current Bobo memory implementation
- Specific gaps between biological principles and current implementation
- Actionable recommendations with implementation specifications

### 2.3 Methodology

Our analysis draws from:
- Peer-reviewed neuroscience literature (see References)
- Neural network research on memory-augmented architectures
- Direct code review of the Bobo memory system
- Database schema and query analysis

---

## 3. Biological Memory Systems: A Deep Dive

### 3.1 Memory Formation & Encoding

#### 3.1.1 The Multi-Stage Model

Human memory formation follows a well-established pathway first proposed by Atkinson & Shiffrin (1968) and refined by subsequent research:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MEMORY FORMATION PATHWAY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Sensory Input ──► Sensory Memory ──► Working Memory ──► Long-term Memory │
│                      (< 1 second)      (seconds-minutes)  (hours-lifetime)  │
│                           │                   │                   │         │
│                           ▼                   ▼                   ▼         │
│                      Iconic/Echoic      Phonological Loop    Declarative    │
│                        Buffer           Visuospatial Pad     Procedural     │
│                                         Central Executive                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sensory Memory** (Sperling, 1960)
- Duration: 200-500ms (visual) to 3-4 seconds (auditory)
- Capacity: Large but rapidly decaying
- Function: Buffer for initial processing

**Working Memory** (Baddeley & Hitch, 1974; Baddeley, 2000)
- Duration: 15-30 seconds without rehearsal
- Capacity: 4±1 items (Cowan, 2001), revised from Miller's 7±2
- Components:
  - **Phonological loop**: Verbal/acoustic information
  - **Visuospatial sketchpad**: Visual and spatial information
  - **Episodic buffer**: Integration of information from multiple sources
  - **Central executive**: Attention control and coordination

**Long-term Memory**
- Duration: Hours to lifetime
- Capacity: Effectively unlimited
- Encoding mechanisms: Elaborative rehearsal, semantic processing, emotional tagging

#### 3.1.2 The Role of the Hippocampus

The hippocampus serves as the critical gateway between working memory and long-term storage (Squire & Zola-Morgan, 1991):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HIPPOCAMPAL MEMORY CIRCUIT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Entorhinal Cortex ──► Dentate Gyrus ──► CA3 ──► CA1 ──► Subiculum        │
│         │                    │              │       │          │            │
│         │                    │              │       │          │            │
│   Sensory Input         Pattern         Pattern  Output    Back to         │
│   Integration          Separation      Completion Formation Neocortex      │
│                                                                              │
│   Key Functions:                                                            │
│   • Pattern separation: Distinguishing similar experiences                  │
│   • Pattern completion: Reconstructing full memories from partial cues      │
│   • Indexing: Creating pointers to distributed cortical representations     │
│   • Binding: Associating disparate elements into coherent episodes          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Critical Insight for Implementation**: The hippocampus doesn't store memories—it creates an *index* that allows distributed cortical patterns to be reconstructed. This suggests our memory system should focus on *retrieval cues* and *association patterns* rather than verbatim storage.

#### 3.1.3 Levels of Processing

Craik & Lockhart (1972) demonstrated that deeper semantic processing leads to stronger memory encoding:

| Processing Level | Description | Retention |
|-----------------|-------------|-----------|
| **Structural** | Physical characteristics (font, case) | Poor |
| **Phonemic** | Sound patterns (rhymes, pronunciation) | Moderate |
| **Semantic** | Meaning, associations, implications | Excellent |

**Implication**: Memories stored with rich semantic context (associations, implications, related concepts) will be more retrievable than isolated facts.

#### 3.1.4 Encoding Specificity Principle

Tulving & Thomson (1973) established that memory retrieval is most effective when the retrieval context matches the encoding context:

> "What is stored is determined by what is perceived and how it is encoded, and what is stored determines what retrieval cues are effective in providing access to what is stored."

**Practical Example**:
- Memory encoded: "User prefers TypeScript" (during conversation about React project)
- Retrieval context A: "What languages does the user know?" → May retrieve
- Retrieval context B: "Setting up a React project" → More likely to retrieve (context match)

---

### 3.2 Memory Types & Taxonomy

#### 3.2.1 Tulving's Memory Systems (1972, 1985)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MEMORY SYSTEMS TAXONOMY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              LONG-TERM MEMORY                                │
│                                     │                                        │
│                    ┌────────────────┴────────────────┐                      │
│                    │                                 │                       │
│              DECLARATIVE                       NON-DECLARATIVE              │
│              (Explicit)                         (Implicit)                   │
│                    │                                 │                       │
│         ┌─────────┴─────────┐           ┌──────────┼──────────┐            │
│         │                   │           │          │          │             │
│     EPISODIC            SEMANTIC    PROCEDURAL  PRIMING  CONDITIONING      │
│   (Events/Episodes)   (Facts/Concepts) (Skills)                             │
│                                                                              │
│   "I had coffee at     "Paris is the   "How to    Implicit  Learned        │
│    Starbucks at 3pm     capital of      ride a     word      emotional     │
│    yesterday"           France"         bike"      completion responses    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Episodic Memory

**Characteristics** (Tulving, 2002):
- **Autonoetic consciousness**: Awareness of self in time
- **Mental time travel**: Re-experiencing past events
- **What-Where-When binding**: Contextual associations
- **Source monitoring**: Remembering where information came from

**Neural Basis**:
- Hippocampus (especially CA1): Temporal sequencing
- Prefrontal cortex: Source monitoring
- Parietal cortex: Spatial context
- Amygdala: Emotional context

**Example in User Memory**:
```
Episodic: "On November 15th, during our conversation about the Vercel project,
           the user mentioned they'd been debugging a deployment issue for 3 hours
           and were frustrated."

Contains: Time, context, emotional state, specific details
```

#### 3.2.3 Semantic Memory

**Characteristics**:
- Context-independent facts
- Organized conceptually (not temporally)
- Abstracted from specific episodes
- Supports inference and generalization

**Neural Basis**:
- Anterior temporal lobe: Conceptual knowledge
- Lateral temporal cortex: Category-specific knowledge
- Prefrontal cortex: Semantic retrieval and selection

**Example in User Memory**:
```
Semantic: "The user is a senior software engineer specializing in TypeScript
           and React."

Contains: Abstracted fact, no specific temporal context
```

#### 3.2.4 The Episodic-to-Semantic Transformation

Critically, episodic memories gradually transform into semantic memories through consolidation (McClelland et al., 1995):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              EPISODIC → SEMANTIC TRANSFORMATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DAY 1-7:                                                                   │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │ Episode 1: "Nov 10 - User mentioned working on React app"    │          │
│   │ Episode 2: "Nov 12 - User asked about TypeScript types"      │          │
│   │ Episode 3: "Nov 15 - User debugging React useState issue"    │          │
│   └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼  (Consolidation)                              │
│                                                                              │
│   WEEK 2+:                                                                   │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │ Semantic: "User actively works with React and TypeScript"    │          │
│   │           "User has intermediate React knowledge"            │          │
│   └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│   Episodes may be forgotten, but extracted knowledge persists               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Memory Consolidation

#### 3.3.1 Systems Consolidation

The transfer of memories from hippocampus to neocortex occurs over days to years (Frankland & Bontempi, 2005):

**Standard Consolidation Model**:
1. Initial encoding creates hippocampal-cortical connections
2. During sleep, hippocampus "replays" memories
3. Repeated reactivation strengthens cortical connections
4. Eventually, cortical connections become independent of hippocampus

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SYSTEMS CONSOLIDATION TIMELINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Time Post-Encoding:  Hours    Days     Weeks    Months    Years           │
│                          │        │         │        │         │            │
│   Hippocampal           ████████████████████                                │
│   Dependence            ████████████████                                    │
│                         ██████████████                                      │
│                         ████████████                                        │
│                         ██████████                                          │
│                                                                              │
│   Neocortical                    ████████████████████████████████           │
│   Independence                       ██████████████████████████████████     │
│                                          ██████████████████████████████████ │
│                                                                              │
│   Memory Type:          Episodic ──────────────────────► Semantic           │
│                         (Rich context)                   (Gist only)        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Sleep and Memory Consolidation

Sleep plays a critical role in memory consolidation (Walker & Stickgold, 2004):

**Slow-Wave Sleep (SWS)**:
- Hippocampal sharp-wave ripples replay recent experiences
- Cortical slow oscillations coordinate memory transfer
- Primarily benefits declarative memory

**REM Sleep**:
- Integration of new memories with existing knowledge
- Creative problem-solving and insight
- Emotional memory processing

**Key Mechanisms**:
1. **Reactivation**: Spontaneous replay of neural patterns
2. **Synaptic homeostasis**: Weak connections pruned, strong ones preserved
3. **Schema integration**: New memories fitted into existing knowledge structures

#### 3.3.3 Memory Updating and Reconsolidation

Nader et al. (2000) discovered that retrieved memories become temporarily labile:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RECONSOLIDATION PROCESS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Stable Memory ──► Retrieval ──► Labile State ──► Reconsolidation ──► New  │
│        │               │              │                   │           Stable │
│        │               │              │                   │           Memory │
│        │               │              │                   │                  │
│        │               │        ┌─────┴─────┐             │                  │
│        │               │        │           │             │                  │
│        │               │    Modify      Maintain          │                  │
│        │               │    Memory      Memory            │                  │
│        │               │        │           │             │                  │
│        │               │        ▼           ▼             │                  │
│        │               │   Updated     Original           │                  │
│        │               │   Content     Content            │                  │
│                                                                              │
│   Implication: Every retrieval is an opportunity to update the memory       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Insight**: When a memory is retrieved, we should update its metadata (access count, timestamp) and potentially its content if new information is available.

---

### 3.4 Memory Retrieval Mechanisms

#### 3.4.1 Pattern Completion

The hippocampal CA3 region performs pattern completion—reconstructing full memories from partial cues (Marr, 1971; McNaughton & Morris, 1987):

**Mechanism**:
- Recurrent connections in CA3 form an autoassociative network
- Partial input pattern activates stored pattern through attractor dynamics
- Enables recall from incomplete or noisy cues

**Computational Model** (Hopfield Network):
```
E = -0.5 Σᵢⱼ wᵢⱼ sᵢ sⱼ

Where:
- E = Energy (network seeks to minimize)
- wᵢⱼ = Synaptic weight between neurons i and j
- sᵢ, sⱼ = Activation states of neurons

The network settles into stored patterns (energy minima)
```

**Relevance to Implementation**: Vector similarity search performs a form of pattern completion—finding stored memories that most closely match a query vector.

#### 3.4.2 Spreading Activation

Collins & Loftus (1975) proposed that memory is organized as a semantic network where activation spreads along associative links:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SPREADING ACTIVATION EXAMPLE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              [COFFEE]                                        │
│                             /   |   \                                        │
│                           /     |     \                                      │
│                    [CAFFEINE] [MUG] [MORNING]                               │
│                        |        |       |                                    │
│                        |        |       |                                    │
│                    [ENERGY] [CERAMIC] [BREAKFAST]                           │
│                        |                   |                                 │
│                        |                   |                                 │
│                   [PRODUCTIVITY]      [ROUTINE]                             │
│                                                                              │
│   Query: "coffee"                                                            │
│   Direct activation: COFFEE (1.0)                                            │
│   1-hop activation: CAFFEINE (0.7), MUG (0.6), MORNING (0.8)                │
│   2-hop activation: ENERGY (0.5), BREAKFAST (0.6), etc.                     │
│                                                                              │
│   The user might recall their "morning routine" when thinking about coffee  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Experimental Evidence**:
- Meyer & Schvaneveldt (1971): Semantic priming effects
- Faster recognition of "nurse" after "doctor" than after "bread"
- Activation decays with semantic distance

#### 3.4.3 Context-Dependent Memory

Memory retrieval is enhanced when retrieval context matches encoding context:

**State-Dependent Learning** (Godden & Baddeley, 1975):
- Divers learned words underwater or on land
- Recall was 40% better when retrieval context matched encoding context

**Mood-Congruent Memory** (Bower, 1981):
- Happy moods facilitate recall of happy memories
- Emotional state acts as a retrieval cue

**Environmental Reinstatement**:
- Physical context serves as retrieval cue
- "Context" includes: location, time of day, concurrent tasks, emotional state

#### 3.4.4 Retrieval-Induced Forgetting

Anderson et al. (1994) demonstrated that retrieving some memories can inhibit related memories:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RETRIEVAL-INDUCED FORGETTING                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Category: FRUITS                                                           │
│   Members: Apple, Banana, Cherry, Date, Elderberry                          │
│                                                                              │
│   Practice Phase: Repeatedly retrieve "Apple" and "Banana"                  │
│                                                                              │
│   Result:                                                                    │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │  Apple, Banana    →  Strengthened (practiced)                │          │
│   │  Cherry, Date     →  Inhibited (same category, not practiced)│          │
│   │  (other category) →  Baseline (unaffected)                   │          │
│   └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│   Mechanism: Competition during retrieval leads to inhibition               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Consideration**: Frequently retrieved memories may inadvertently suppress related but less-accessed memories. This could be mitigated through diversity-promoting retrieval strategies.

---

### 3.5 Forgetting & Memory Maintenance

#### 3.5.1 The Ebbinghaus Forgetting Curve (1885)

Hermann Ebbinghaus established that memory retention follows an exponential decay:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EBBINGHAUS FORGETTING CURVE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Retention                                                                  │
│   100% ├──●                                                                  │
│        │   \                                                                 │
│    80% │    \                                                                │
│        │     ●                                                               │
│    60% │      \                                                              │
│        │       \                                                             │
│    40% │        ●────●                                                       │
│        │              ────●                                                  │
│    20% │                   ────●────●────●────●                              │
│        │                                                                     │
│     0% └────┬────┬────┬────┬────┬────┬────┬────                             │
│           20min  1hr  9hr  1day 2day 6day 31day                             │
│                                                                              │
│   Mathematical Model:  R(t) = e^(-t/S)                                      │
│                                                                              │
│   Where: R = Retention, t = Time, S = Memory Strength                       │
│                                                                              │
│   Memory strength S is increased by:                                         │
│   • Repetition (spaced practice > massed practice)                          │
│   • Emotional significance                                                   │
│   • Deep semantic processing                                                 │
│   • Association with existing knowledge                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.5.2 Spaced Repetition Effect

Ebbinghaus also discovered that distributed practice leads to better retention than massed practice:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SPACING EFFECT                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   MASSED PRACTICE (Cramming):                                                │
│   Day 1: ████████████████████████████████████████ (10 reviews)              │
│   Day 2-30: (no practice)                                                    │
│   Result: Rapid initial learning, rapid forgetting                          │
│                                                                              │
│   SPACED PRACTICE:                                                           │
│   Day 1:  ████ (2 reviews)                                                   │
│   Day 3:  ████ (2 reviews)                                                   │
│   Day 7:  ████ (2 reviews)                                                   │
│   Day 14: ████ (2 reviews)                                                   │
│   Day 28: ██ (1 review)                                                      │
│   Result: Slower initial learning, much better long-term retention          │
│                                                                              │
│   Optimal Spacing Formula (Pimsleur, 1967):                                 │
│   Interval_n = Interval_(n-1) × 2                                           │
│                                                                              │
│   Or more sophisticated: Interval_n = Interval_(n-1) × e^(strength/decay)   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.5.3 Forgetting as Adaptive Feature

Bjork & Bjork (1992) proposed that forgetting is not a flaw but an adaptive feature:

**Benefits of Forgetting**:
1. **Reduces interference**: Old, irrelevant information doesn't crowd out new learning
2. **Enables generalization**: Forgetting details allows abstraction of patterns
3. **Computational efficiency**: Not everything needs permanent storage
4. **Context flexibility**: Outdated associations don't constrain new learning

**Two Types of Forgetting**:
- **Storage decay**: Information is truly lost
- **Retrieval failure**: Information exists but is inaccessible (cue-dependent)

#### 3.5.4 Interference Theory

Memory failures often result from interference between similar memories:

**Proactive Interference**: Old memories interfere with new learning
- Example: Old phone number interferes with learning new one

**Retroactive Interference**: New memories interfere with old memories
- Example: New password makes you forget old password

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTERFERENCE EFFECTS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PROACTIVE INTERFERENCE:                                                    │
│   ┌──────────────────┐      ┌──────────────────┐                            │
│   │  Learn A first   │ ───► │ A interferes     │                            │
│   │  (old password)  │      │ with learning B  │                            │
│   └──────────────────┘      └──────────────────┘                            │
│                                                                              │
│   RETROACTIVE INTERFERENCE:                                                  │
│   ┌──────────────────┐      ┌──────────────────┐                            │
│   │  Learn B second  │ ───► │ B interferes     │                            │
│   │  (new password)  │      │ with recalling A │                            │
│   └──────────────────┘      └──────────────────┘                            │
│                                                                              │
│   Implementation Consideration:                                              │
│   Similar memories (high embedding similarity) may interfere with each      │
│   other. Consider storing distinctiveness scores or explicitly marking      │
│   superseded information.                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Neural Network Approaches to Memory

### 4.1 Attention Mechanisms

#### 4.1.1 Self-Attention (Transformers)

Vaswani et al. (2017) introduced self-attention, which computes relevance between all token positions:

```
Attention(Q, K, V) = softmax(QK^T / √d_k) V

Where:
- Q = Query matrix
- K = Key matrix
- V = Value matrix
- d_k = Dimension of keys
```

**Memory Properties**:
- Implicit memory in model weights (parametric memory)
- Explicit memory in context window (in-context learning)
- No persistent memory across sessions (stateless)

#### 4.1.2 Limitations of Attention-Only Memory

| Aspect | Biological Memory | Transformer Memory |
|--------|------------------|-------------------|
| Persistence | Lifetime | Single context window |
| Capacity | Effectively unlimited | Fixed context length |
| Consolidation | Continuous | None |
| Selective forgetting | Yes | All-or-nothing |
| Associative retrieval | Multi-hop | Single-hop (per layer) |

### 4.2 Memory-Augmented Neural Networks

#### 4.2.1 Neural Turing Machines (Graves et al., 2014)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NEURAL TURING MACHINE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌─────────────────┐                                  │
│                        │   Controller    │                                  │
│                        │    (LSTM)       │                                  │
│                        └────────┬────────┘                                  │
│                                 │                                            │
│                    ┌────────────┼────────────┐                              │
│                    │            │            │                               │
│                    ▼            ▼            ▼                               │
│               ┌────────┐  ┌────────┐  ┌────────┐                            │
│               │  Read  │  │ Write  │  │ Erase  │                            │
│               │  Head  │  │  Head  │  │  Head  │                            │
│               └────┬───┘  └───┬────┘  └───┬────┘                            │
│                    │          │           │                                  │
│                    └──────────┼───────────┘                                  │
│                               │                                              │
│                               ▼                                              │
│                    ┌──────────────────────┐                                 │
│                    │    External Memory   │                                 │
│                    │    [N × M matrix]    │                                 │
│                    └──────────────────────┘                                 │
│                                                                              │
│   Addressing Mechanisms:                                                     │
│   • Content-based: Similarity to query vector                               │
│   • Location-based: Relative shifts from previous position                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Differentiable Neural Computer (Graves et al., 2016)

Extends NTM with:
- **Temporal linking**: Tracks order of writes
- **Memory allocation**: Manages free/used memory slots
- **Read modes**: Content-based, temporal forward, temporal backward

#### 4.2.3 Memory Networks (Weston et al., 2015)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MEMORY NETWORK ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Components:                                                                │
│                                                                              │
│   I (Input): Convert raw input to internal representation                   │
│        │                                                                     │
│        ▼                                                                     │
│   G (Generalization): Update memory slots based on new input                │
│        │                                                                     │
│        ▼                                                                     │
│   O (Output): Generate response from memory + input                         │
│        │                                                                     │
│        ▼                                                                     │
│   R (Response): Convert output to desired format                            │
│                                                                              │
│   Memory: Set of slots m₁, m₂, ..., mₙ                                      │
│   Attention: Query attends over memory slots to retrieve relevant info      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Retrieval-Augmented Generation

#### 4.3.1 RAG Architecture (Lewis et al., 2020)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RAG ARCHITECTURE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Query ──► Encoder ──► Similarity Search ──► Retrieved Docs                │
│      │                        │                      │                       │
│      │                        │                      │                       │
│      └────────────────────────┴──────────────────────┘                      │
│                               │                                              │
│                               ▼                                              │
│                    ┌──────────────────┐                                     │
│                    │  Generator LLM   │                                     │
│                    │  (with context)  │                                     │
│                    └────────┬─────────┘                                     │
│                             │                                                │
│                             ▼                                                │
│                         Response                                             │
│                                                                              │
│   Types:                                                                     │
│   • RAG-Sequence: Retrieve once, generate entire response                   │
│   • RAG-Token: Retrieve at each generation step                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Hybrid Search (Dense + Sparse)

Your current implementation follows this pattern:

| Method | Mechanism | Strengths | Weaknesses |
|--------|-----------|-----------|------------|
| **Dense (Vector)** | Semantic similarity | Captures meaning, synonyms | Misses exact matches |
| **Sparse (BM25)** | Term frequency | Exact keyword matching | Misses semantic similarity |
| **Hybrid** | Weighted combination | Best of both | Requires tuning weights |

**Your Implementation**: 70% dense + 30% sparse (good baseline)

### 4.4 Relevant Research & Models

#### 4.4.1 MemGPT / Letta (Packer et al., 2023)

Key innovations relevant to your system:
- **Hierarchical memory**: Main context, archival storage, recall storage
- **Self-editing memory**: Agent can modify its own memory
- **Memory management tools**: Explicit read/write/search operations

#### 4.4.2 Generative Agents (Park et al., 2023)

Stanford/Google's "Smallville" paper introduced:
- **Memory stream**: Timestamped observations
- **Retrieval scoring**: Recency × Importance × Relevance
- **Reflection**: Periodic synthesis of higher-level insights

**Retrieval Score Formula**:
```
score = α × recency + β × importance + γ × relevance

Where:
- recency = exponential decay since last access
- importance = LLM-assigned score (1-10)
- relevance = embedding similarity to query
```

#### 4.4.3 RETRO (Borgeaud et al., 2022)

Retrieval-Enhanced Transformer:
- 25x smaller model achieves similar performance via retrieval
- Chunked cross-attention over retrieved neighbors
- Shows retrieval can substitute for parameters

---

## 5. Current Implementation Analysis

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BOBO MEMORY SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   Chat API      │    │  Agent Handler  │    │  Memory API     │        │
│   │  /api/chat      │    │ (Claude SDK)    │    │ /api/memory/*   │        │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│            │                      │                      │                  │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                          │
│                                   ▼                                          │
│                    ┌──────────────────────────┐                             │
│                    │     Memory Tools         │                             │
│                    │  • search_memory         │                             │
│                    │  • remember_fact         │                             │
│                    │  • update_memory         │                             │
│                    │  • forget_memory         │                             │
│                    └────────────┬─────────────┘                             │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌──────────────────────────┐                             │
│                    │    Database Queries      │                             │
│                    │  • hybridMemorySearch    │                             │
│                    │  • findSimilarMemories   │                             │
│                    │  • createMemory          │                             │
│                    └────────────┬─────────────┘                             │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌──────────────────────────┐                             │
│                    │   Supabase/PostgreSQL    │                             │
│                    │   • memory_entries       │                             │
│                    │   • pgvector (1536-dim)  │                             │
│                    │   • pg_trgm (fuzzy)      │                             │
│                    └──────────────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Schema & Data Model

**Current `memory_entries` Table**:

```sql
CREATE TABLE memory_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),

  -- Content
  category TEXT NOT NULL,          -- 6 categories (flat)
  subcategory TEXT,                -- Unused in practice
  content TEXT NOT NULL,           -- The actual memory
  summary TEXT,                    -- Unused in practice

  -- Confidence & Provenance
  confidence FLOAT (0.5-1.0),      -- How certain we are
  source_type TEXT,                -- manual|extracted|suggested|agent_tool
  source_chat_ids UUID[],          -- Which chats contributed
  source_project_ids UUID[],       -- Which projects contributed
  source_message_count INT,        -- Number of source messages

  -- Temporal (partially used)
  time_period TEXT,                -- current|recent|past|long_ago
  relevance_score FLOAT,           -- Static, not updated
  last_updated TIMESTAMPTZ,        -- When content changed
  last_mentioned TIMESTAMPTZ,      -- When last referenced
  created_at TIMESTAMPTZ,

  -- Search
  content_hash TEXT,               -- Deduplication
  embedding vector(1536),          -- Semantic search

  -- Soft delete
  is_active BOOLEAN,
  deleted_reason TEXT,
  deleted_at TIMESTAMPTZ
);
```

**Current Categories** (6 total):
1. `work_context` — Job, role, current projects
2. `personal_context` — Preferences, background
3. `top_of_mind` — Current focus, recent interests
4. `brief_history` — Recent interactions summary
5. `long_term_background` — Established facts
6. `other_instructions` — User preferences for AI behavior

### 5.3 Retrieval Mechanisms

**Primary: `hybrid_memory_search` Function**

```sql
-- Current implementation (simplified)
SELECT
  id, category, content, confidence, last_updated,
  (
    0.7 * (1 - (embedding <=> query_embedding)) +  -- Vector similarity
    0.3 * ts_rank(to_tsvector(content), query)     -- Text search
  ) as similarity
FROM memory_entries
WHERE is_active = true
  AND embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT match_count;
```

**Analysis**:
- ✅ Hybrid approach (dense + sparse) is sound
- ✅ Uses pgvector for efficient similarity search
- ❌ No temporal weighting (recency, frequency)
- ❌ No importance weighting
- ❌ No context awareness
- ❌ Single-pass retrieval

### 5.4 Memory Tools

| Tool | Function | Safety | Issue |
|------|----------|--------|-------|
| `search_memory` | Hybrid search | Auto-approved | No context awareness |
| `remember_fact` | Create with dedup | Auto-approved | Rejects near-matches |
| `update_memory` | Modify existing | Requires approval | No embedding update |
| `forget_memory` | Soft delete | Requires approval | Good implementation |

---

## 6. Gap Analysis: Biology vs Implementation

### 6.1 Gap 1: Temporal Dynamics

#### Biological Reality

Memory strength follows the Ebbinghaus forgetting curve with spacing effects:

```
R(t) = e^(-t/S)

Where:
- R = retention/accessibility
- t = time since last access
- S = memory strength (increased by repetition)
```

Memories that are:
- Recently accessed → More accessible
- Frequently accessed → More accessible
- Emotionally significant → More accessible

#### Current Implementation

```sql
-- hybrid_memory_search (lines 58-61)
-- NO temporal weighting whatsoever
(
  vector_weight * (1 - (m.embedding <=> query_embedding)) +
  text_weight * ts_rank(...)
) as similarity
```

**Impact**:
- A memory from 6 months ago (never accessed) scores equally with yesterday's frequently-used memory
- No mechanism to naturally "forget" stale information
- Memory database grows unboundedly without prioritization

#### Severity: 🔴 CRITICAL

#### Recommended Fix

```sql
-- Add columns
ALTER TABLE memory_entries
  ADD COLUMN last_accessed TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN access_count INT DEFAULT 0;

-- Enhanced scoring
final_score =
  vector_weight * vector_similarity +
  text_weight * text_similarity +
  recency_weight * EXP(-0.693 * days_since_access / half_life) +
  frequency_weight * LOG(1 + access_count) / LOG(100)
```

---

### 6.2 Gap 2: Associative Networks

#### Biological Reality

Memories are organized in associative networks. Activating one concept spreads activation to related concepts:

```
"coffee" → "caffeine" → "energy" → "morning" → "routine"
```

This enables:
- Recall of indirectly related information
- Creative connections between concepts
- Robust retrieval from multiple entry points

#### Current Implementation

```typescript
// memory-tools.ts - Single direct query
const embedding = await generateEmbedding(query);
const { data: memories } = await supabase.rpc('hybrid_memory_search', {
  query_embedding: embedding,
  // ... returns only direct matches
});
```

**Impact**:
- Miss semantically-adjacent but valuable memories
- Can't leverage relationship patterns
- Limited "creative" recall capabilities

#### Severity: 🔴 CRITICAL

#### Recommended Fix

```sql
-- Memory relationship graph
CREATE TABLE memory_relationships (
  source_id UUID REFERENCES memory_entries(id),
  target_id UUID REFERENCES memory_entries(id),
  relationship_type VARCHAR(30),  -- similar, elaborates, contradicts, temporal
  strength FLOAT,
  PRIMARY KEY (source_id, target_id)
);

-- Build edges when embedding similarity > 0.6
-- Implement 2-hop retrieval with activation decay
```

---

### 6.3 Gap 3: Memory Type Distinction

#### Biological Reality

Tulving's taxonomy distinguishes:
- **Episodic**: "I debugged a React bug on Tuesday" (contextual)
- **Semantic**: "I know React" (decontextualized fact)

Episodic memories consolidate into semantic memories over time.

#### Current Implementation

```sql
-- All memories treated as semantic facts
category TEXT NOT NULL  -- work_context, personal_context, etc.
-- No episodic metadata: when, where, emotional context
```

**Impact**:
- Lose temporal context of when facts were learned
- Can't track evolution of user's knowledge/preferences
- No mechanism for episodic → semantic consolidation

#### Severity: 🟠 HIGH

#### Recommended Fix

```sql
ALTER TABLE memory_entries
  ADD COLUMN memory_type VARCHAR(20) DEFAULT 'semantic',
  ADD COLUMN episode_context JSONB,
  ADD COLUMN consolidated_from UUID[];

-- episode_context example:
-- {
--   "chat_id": "...",
--   "timestamp": "2025-11-15T14:30:00Z",
--   "conversation_topic": "React debugging",
--   "emotional_valence": 0.3,  -- frustration
--   "confidence_source": "explicit_statement"
-- }
```

---

### 6.4 Gap 4: Consolidation Processes

#### Biological Reality

During sleep, the brain:
1. Replays recent memories (hippocampal sharp-wave ripples)
2. Integrates new information with existing knowledge
3. Abstracts patterns from specific episodes
4. Prunes weak/irrelevant connections

#### Current Implementation

```typescript
// Memories are stored and never refined
// No consolidation, no abstraction, no pruning
// Database grows indefinitely
```

**Impact**:
- Accumulation of redundant near-duplicate memories
- No extraction of higher-level patterns
- No contradiction detection
- No natural "forgetting" of irrelevant information

#### Severity: 🟠 HIGH

#### Recommended Fix

```typescript
// Background consolidation job (run nightly)
async function consolidateMemories() {
  // 1. Cluster similar memories
  const clusters = await findMemoryClusters(threshold: 0.75);

  // 2. Summarize clusters into abstractions
  for (const cluster of clusters.filter(c => c.length > 3)) {
    const summary = await llmSummarize(cluster);
    await createConsolidatedMemory(summary, cluster);
  }

  // 3. Detect and flag contradictions
  const contradictions = await findContradictions();
  await flagForReview(contradictions);

  // 4. Prune low-value memories
  await pruneMemories({
    accessCount: 0,
    ageInDays: 90,
    confidence: { lt: 0.6 }
  });
}
```

---

### 6.5 Gap 5: Context-Dependent Retrieval

#### Biological Reality

Tulving's encoding specificity principle: Retrieval is most effective when context matches encoding context.

- Same query in different contexts should retrieve different memories
- Context includes: current topic, emotional state, project, goals

#### Current Implementation

```typescript
// memory-tools.ts:152 - Context-blind
const embedding = await generateEmbedding(query);
// Only the query text - conversation context ignored
```

**Impact**:
- Same query always returns same results
- Miss contextually-relevant memories
- Can't leverage "what we were just talking about"

#### Severity: 🟠 HIGH

#### Recommended Fix

```typescript
async function contextAwareSearch(
  query: string,
  conversationContext: string[],  // Last 3-5 messages
  projectId?: string
) {
  // Combine query with context
  const contextualQuery = [
    ...conversationContext.slice(-3),
    query
  ].join('\n');

  const embedding = await generateEmbedding(contextualQuery);

  // Boost same-project memories
  return hybridSearchWithBoost(embedding, {
    projectBoost: projectId ? 1.3 : 1.0
  });
}
```

---

### 6.6 Gap 6: Hebbian Reinforcement

#### Biological Reality

"Neurons that fire together wire together" (Hebb, 1949)

- Repeated activation strengthens memory traces
- Similar experiences reinforce existing memories
- Memories don't duplicate—they strengthen

#### Current Implementation

```typescript
// memory-tools.ts:248-253 - Reject instead of reinforce
const duplicates = await findSimilarMemories(content, 0.85);
if (duplicates.length > 0) {
  return `Similar memory already exists...`;  // REJECTED!
}
```

**Impact**:
- User mentions "I prefer TypeScript" 10 times → stored once, rejected 9 times
- No mechanism to increase confidence from repetition
- High-similarity memories not strengthened

#### Severity: 🔴 CRITICAL

#### Recommended Fix

```typescript
if (duplicates.length > 0) {
  const existing = duplicates[0];

  // REINFORCE instead of reject
  await updateMemory(existing.id, {
    confidence: Math.min(1.0, existing.confidence + 0.05),
    access_count: (existing.access_count || 0) + 1,
    last_mentioned: new Date(),
  });

  return `Reinforced memory: "${existing.content}" (confidence: ${newConfidence})`;
}
```

---

### 6.7 Gap 7: Working Memory

#### Biological Reality

Working memory (Baddeley, 2000):
- Limited capacity: 4±1 items (Cowan, 2001)
- Active manipulation, not just storage
- Central executive coordinates information
- Contents are the "focus of attention"

#### Current Implementation

```typescript
// No explicit working memory
// Uses full conversation history until compression threshold
// Context window treated as single buffer
```

**Impact**:
- No prioritization of "currently relevant" memories
- Context compression is all-or-nothing
- Can't maintain focus across conversation turns

#### Severity: 🟡 MEDIUM

#### Recommended Fix

```typescript
interface WorkingMemory {
  items: MemoryEntry[];  // Max 5-7 items
  activeGoal: string;
  lastUpdated: Date;
}

// On each turn, update working memory
function updateWorkingMemory(
  current: WorkingMemory,
  newMessage: string,
  retrievedMemories: MemoryEntry[]
): WorkingMemory {
  // Score each for current relevance
  const scored = [...current.items, ...retrievedMemories]
    .map(m => ({ ...m, relevance: computeRelevance(m, newMessage) }))
    .sort((a, b) => b.relevance - a.relevance);

  return { items: scored.slice(0, 5), ... };
}
```

---

### 6.8 Gap 8: Emotional Salience

#### Biological Reality

The amygdala modulates memory encoding:
- Emotionally significant events remembered better
- Emotional context serves as retrieval cue
- Flashbulb memories for highly emotional events

#### Current Implementation

```sql
-- Only confidence score (0.5-1.0)
confidence FLOAT NOT NULL DEFAULT 0.8
-- No importance or emotional salience dimension
```

**Impact**:
- "User's child is sick" weighted same as "User likes dark mode"
- No priority for emotionally significant information
- Can't detect urgency or importance

#### Severity: 🟡 MEDIUM

#### Recommended Fix

```sql
ALTER TABLE memory_entries
  ADD COLUMN importance FLOAT DEFAULT 0.5
    CHECK (importance >= 0 AND importance <= 1);

-- Importance detection:
-- 1. Explicit markers ("This is really important...")
-- 2. Emotional language (sentiment analysis)
-- 3. Category-based defaults
-- 4. User emphasis patterns
```

---

### 6.9 Gap 9: Hierarchical Organization

#### Biological Reality

Knowledge is organized hierarchically:
- Superordinate: "Animal"
- Basic level: "Dog" (most commonly used)
- Subordinate: "Golden Retriever"

Schemas provide top-down organization.

#### Current Implementation

```sql
-- Flat 6-category structure
category TEXT NOT NULL CHECK (category IN (
  'work_context',
  'personal_context',
  'top_of_mind',
  'brief_history',
  'long_term_background',
  'other_instructions'
))
```

**Impact**:
- No abstraction hierarchy within categories
- Can't retrieve at appropriate specificity level
- No schema-based inference

#### Severity: 🟡 MEDIUM

#### Recommended Fix

```
Level 0: Individual memories
  "User prefers tabs over spaces"
  "User uses Prettier for formatting"
  "User configures ESLint strictly"

Level 1: Category summaries
  "User has strong code style preferences"

Level 2: Domain summaries
  "User is a detail-oriented developer"

Retrieve at appropriate level based on query specificity.
```

---

### 6.10 Gap 10: Iterative Retrieval

#### Biological Reality

Memory retrieval is reconstructive and iterative:
- Initial cue triggers partial recall
- Partial recall provides new cues
- Progressive refinement until target memory

"Tip of the tongue" phenomenon shows this process.

#### Current Implementation

```typescript
// Single-pass retrieval
const results = await hybridSearch(query);
return results;  // Done. No refinement.
```

**Impact**:
- Miss memories that require indirect access
- Can't leverage retrieved information for better retrieval
- Limited recall from vague queries

#### Severity: 🟡 MEDIUM

#### Recommended Fix

```typescript
async function iterativeRetrieval(
  query: string,
  maxIterations: number = 2
): Promise<MemoryEntry[]> {
  let results: MemoryEntry[] = [];
  let currentQuery = query;

  for (let i = 0; i < maxIterations; i++) {
    const newResults = await hybridSearch(currentQuery);
    results = deduplicateMerge(results, newResults);

    if (newResults.length === 0) break;

    // Use retrieved content to refine query
    currentQuery = await refineQuery(query, newResults);
  }

  return results;
}
```

---

## 7. Recommendations

### 7.1 Tier 1: Critical Improvements

These changes address fundamental architectural gaps and provide highest ROI.

#### 7.1.1 Temporal Weighting System

**Priority**: P0 - Critical
**Effort**: 4-6 hours
**Impact**: Enables natural memory prioritization

**Changes Required**:

1. Schema additions:
```sql
ALTER TABLE memory_entries
  ADD COLUMN last_accessed TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN access_count INT DEFAULT 0;
```

2. Update `hybrid_memory_search` function (see Section 8.1)

3. Update retrieval code to increment access metrics:
```typescript
// After successful retrieval
await supabase
  .from('memory_entries')
  .update({
    last_accessed: new Date(),
    access_count: sql`access_count + 1`
  })
  .in('id', retrievedIds);
```

#### 7.1.2 Hebbian Reinforcement

**Priority**: P0 - Critical
**Effort**: 2-3 hours
**Impact**: Prevents information loss, strengthens frequently-mentioned facts

**Changes Required**:

Update `rememberFactTool.execute`:
```typescript
if (duplicates.length > 0) {
  const existing = duplicates[0];

  // Reinforce instead of reject
  const newConfidence = Math.min(1.0, existing.confidence + 0.05);

  await updateMemory(existing.id, {
    confidence: newConfidence,
    access_count: (existing.access_count || 0) + 1,
    last_mentioned: new Date(),
  });

  return `Reinforced existing memory: "${existing.content}" ` +
         `(confidence increased to ${newConfidence.toFixed(2)})`;
}
```

#### 7.1.3 Context-Aware Retrieval

**Priority**: P0 - Critical
**Effort**: 4-6 hours
**Impact**: Significantly improves retrieval relevance

**Changes Required**:

1. Modify `searchMemoryTool` to accept conversation context:
```typescript
execute: async ({ query, category, limit, conversationContext }) => {
  // Combine query with context for embedding
  const contextualText = conversationContext
    ? [...conversationContext.slice(-3), query].join('\n')
    : query;

  const embedding = await generateEmbedding(contextualText);
  // ... rest of search
}
```

2. Pass conversation context from agent handler

### 7.2 Tier 2: Major Enhancements

These changes require more effort but provide substantial improvements.

#### 7.2.1 Memory Consolidation Job

**Priority**: P1 - High
**Effort**: 8-12 hours
**Impact**: Prevents memory bloat, enables abstraction

**Implementation**:
- Background job (Vercel Cron or similar)
- Runs daily during low-usage period
- Operations:
  1. Cluster similar memories
  2. Generate summaries for large clusters
  3. Detect contradictions
  4. Prune stale, low-value memories

See Section 8.3 for detailed specification.

#### 7.2.2 Memory Relationship Graph

**Priority**: P1 - High
**Effort**: 12-16 hours
**Impact**: Enables spreading activation, associative recall

**Implementation**:
1. New `memory_relationships` table
2. Edge creation on memory insert (background)
3. 2-hop retrieval with activation decay

See Section 8.4 for detailed specification.

#### 7.2.3 Episodic-Semantic Distinction

**Priority**: P1 - High
**Effort**: 6-8 hours
**Impact**: Better context preservation, enables consolidation

**Implementation**:
1. Add `memory_type` and `episode_context` columns
2. Modify memory creation to classify type
3. Implement episodic → semantic transformation in consolidation job

### 7.3 Tier 3: Advanced Features

These are enhancements for future consideration.

#### 7.3.1 Working Memory Buffer

**Effort**: 4-6 hours
**Impact**: Better focus management, conversation coherence

#### 7.3.2 Importance/Salience Scoring

**Effort**: 3-4 hours
**Impact**: Prioritize emotionally significant information

#### 7.3.3 Iterative Retrieval

**Effort**: 4-6 hours
**Impact**: Better recall from vague queries

#### 7.3.4 Hierarchical Summarization

**Effort**: 8-12 hours
**Impact**: Multi-level abstraction, appropriate granularity retrieval

---

## 8. Implementation Specifications

### 8.1 Enhanced Hybrid Search Function

```sql
CREATE OR REPLACE FUNCTION enhanced_memory_search(
  query_embedding vector(1536),
  query_text text,
  match_count int DEFAULT 5,
  -- Weights (sum to ~1.0)
  vector_weight float DEFAULT 0.45,
  text_weight float DEFAULT 0.15,
  recency_weight float DEFAULT 0.20,
  frequency_weight float DEFAULT 0.10,
  importance_weight float DEFAULT 0.10,
  -- Decay parameters
  recency_half_life_days float DEFAULT 30.0,
  -- Filters
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  confidence float,
  importance float,
  last_updated timestamptz,
  access_count int,
  combined_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  log_normalizer float := LN(100.0);  -- Normalize frequency to ~0-1 for up to 100 accesses
BEGIN
  RETURN QUERY
  WITH scored_memories AS (
    SELECT
      m.id,
      m.category,
      m.content,
      m.confidence::float,
      COALESCE(m.importance, 0.5)::float as importance,
      m.last_updated,
      COALESCE(m.access_count, 0) as access_count,
      -- Vector similarity (cosine distance converted to similarity)
      (1 - (m.embedding <=> query_embedding))::float as vector_score,
      -- Text similarity (BM25-style ranking)
      COALESCE(
        ts_rank_cd(
          to_tsvector('english', m.content),
          plainto_tsquery('english', query_text),
          32  -- Normalization: divides by document length
        ),
        0
      )::float as text_score,
      -- Recency score (exponential decay)
      EXP(
        -0.693 * EXTRACT(EPOCH FROM NOW() - COALESCE(m.last_accessed, m.created_at))
        / (recency_half_life_days * 86400)
      )::float as recency_score,
      -- Frequency score (logarithmic to prevent dominance)
      (LN(1.0 + COALESCE(m.access_count, 0)) / log_normalizer)::float as frequency_score
    FROM memory_entries m
    WHERE m.is_active = true
      AND (p_user_id IS NULL OR m.user_id = p_user_id)
      AND (p_category IS NULL OR m.category = p_category)
      AND m.embedding IS NOT NULL
  )
  SELECT
    sm.id,
    sm.category,
    sm.content,
    sm.confidence,
    sm.importance,
    sm.last_updated,
    sm.access_count,
    (
      vector_weight * sm.vector_score +
      text_weight * LEAST(sm.text_score, 1.0) +  -- Cap text score at 1.0
      recency_weight * sm.recency_score +
      frequency_weight * sm.frequency_score +
      importance_weight * sm.importance
    )::float as combined_score
  FROM scored_memories sm
  WHERE sm.vector_score > 0.3  -- Minimum relevance threshold
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;
```

### 8.2 Memory Relationship Schema

```sql
-- Memory relationship graph for spreading activation
CREATE TABLE memory_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES memory_entries(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES memory_entries(id) ON DELETE CASCADE,
  relationship_type VARCHAR(30) NOT NULL
    CHECK (relationship_type IN ('similar', 'elaborates', 'contradicts', 'temporal_sequence', 'same_topic')),
  strength FLOAT NOT NULL DEFAULT 0.5
    CHECK (strength >= 0 AND strength <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, target_id)
);

-- Indexes for efficient graph traversal
CREATE INDEX idx_memory_rel_source ON memory_relationships(source_id);
CREATE INDEX idx_memory_rel_target ON memory_relationships(target_id);
CREATE INDEX idx_memory_rel_type ON memory_relationships(relationship_type);

-- Function to build edges for a new memory
CREATE OR REPLACE FUNCTION build_memory_edges(
  p_memory_id uuid,
  p_embedding vector(1536),
  p_user_id uuid,
  similarity_threshold float DEFAULT 0.6
)
RETURNS int  -- Returns count of edges created
LANGUAGE plpgsql
AS $$
DECLARE
  edge_count int := 0;
BEGIN
  -- Find similar memories and create edges
  INSERT INTO memory_relationships (source_id, target_id, relationship_type, strength)
  SELECT
    p_memory_id,
    m.id,
    'similar',
    (1 - (m.embedding <=> p_embedding))::float
  FROM memory_entries m
  WHERE m.id != p_memory_id
    AND m.user_id = p_user_id
    AND m.is_active = true
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> p_embedding)) > similarity_threshold
  ORDER BY (m.embedding <=> p_embedding)
  LIMIT 10  -- Max edges per memory
  ON CONFLICT (source_id, target_id) DO UPDATE SET
    strength = EXCLUDED.strength,
    created_at = NOW();

  GET DIAGNOSTICS edge_count = ROW_COUNT;
  RETURN edge_count;
END;
$$;

-- Spreading activation search
CREATE OR REPLACE FUNCTION spreading_activation_search(
  query_embedding vector(1536),
  query_text text,
  p_user_id uuid,
  direct_limit int DEFAULT 5,
  neighbor_limit int DEFAULT 3,
  activation_decay float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  activation float,
  hop_distance int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH direct_matches AS (
    -- Hop 0: Direct semantic matches
    SELECT
      m.id,
      m.category,
      m.content,
      (1 - (m.embedding <=> query_embedding))::float as activation,
      0 as hop_distance
    FROM memory_entries m
    WHERE m.user_id = p_user_id
      AND m.is_active = true
      AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> query_embedding
    LIMIT direct_limit
  ),
  neighbor_matches AS (
    -- Hop 1: Neighbors of direct matches
    SELECT DISTINCT ON (m.id)
      m.id,
      m.category,
      m.content,
      (dm.activation * activation_decay * r.strength)::float as activation,
      1 as hop_distance
    FROM direct_matches dm
    JOIN memory_relationships r ON r.source_id = dm.id OR r.target_id = dm.id
    JOIN memory_entries m ON m.id = CASE
      WHEN r.source_id = dm.id THEN r.target_id
      ELSE r.source_id
    END
    WHERE m.is_active = true
      AND m.id NOT IN (SELECT id FROM direct_matches)
    ORDER BY m.id, activation DESC
  )
  SELECT * FROM direct_matches
  UNION ALL
  SELECT * FROM neighbor_matches
  ORDER BY activation DESC
  LIMIT direct_limit + neighbor_limit;
END;
$$;
```

### 8.3 Memory Consolidation Job

```typescript
// lib/memory/consolidation.ts

import { supabase } from '@/lib/db/client';
import { generateEmbedding } from '@/lib/ai/embedding';
import { openai } from '@/lib/ai/client';

interface ConsolidationResult {
  clustersProcessed: number;
  memoriesConsolidated: number;
  memoriesPruned: number;
  contradictionsFound: number;
}

/**
 * Main consolidation job - run nightly
 */
export async function consolidateMemories(
  userId: string
): Promise<ConsolidationResult> {
  const result: ConsolidationResult = {
    clustersProcessed: 0,
    memoriesConsolidated: 0,
    memoriesPruned: 0,
    contradictionsFound: 0,
  };

  // 1. Find memory clusters
  const clusters = await findMemoryClusters(userId, 0.75);
  result.clustersProcessed = clusters.length;

  // 2. Process large clusters
  for (const cluster of clusters.filter(c => c.length >= 3)) {
    const consolidated = await consolidateCluster(cluster);
    if (consolidated) {
      result.memoriesConsolidated += cluster.length;
    }
  }

  // 3. Detect contradictions
  const contradictions = await findContradictions(userId);
  result.contradictionsFound = contradictions.length;
  await flagContradictions(contradictions);

  // 4. Prune stale memories
  const pruned = await pruneStaleMemories(userId, {
    maxAgeWithoutAccess: 90,  // days
    minConfidence: 0.5,
  });
  result.memoriesPruned = pruned;

  // 5. Log consolidation run
  await logConsolidation(userId, result);

  return result;
}

/**
 * Find clusters of similar memories
 */
async function findMemoryClusters(
  userId: string,
  threshold: number
): Promise<string[][]> {
  const { data: memories } = await supabase
    .from('memory_entries')
    .select('id, embedding, category')
    .eq('user_id', userId)
    .eq('is_active', true)
    .not('embedding', 'is', null);

  if (!memories || memories.length < 2) return [];

  // Simple clustering: Union-Find based on similarity
  const clusters: Map<string, Set<string>> = new Map();

  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const similarity = cosineSimilarity(
        memories[i].embedding,
        memories[j].embedding
      );

      if (similarity > threshold && memories[i].category === memories[j].category) {
        // Merge clusters
        const clusterId = clusters.get(memories[i].id)?.values().next().value
          || memories[i].id;

        if (!clusters.has(clusterId)) {
          clusters.set(clusterId, new Set([memories[i].id]));
        }
        clusters.get(clusterId)!.add(memories[j].id);
        clusters.set(memories[j].id, clusters.get(clusterId)!);
      }
    }
  }

  // Convert to array of clusters
  const seen = new Set<string>();
  const result: string[][] = [];

  for (const [id, cluster] of clusters) {
    if (!seen.has(id)) {
      result.push(Array.from(cluster));
      cluster.forEach(cid => seen.add(cid));
    }
  }

  return result;
}

/**
 * Consolidate a cluster into a summary memory
 */
async function consolidateCluster(clusterIds: string[]): Promise<boolean> {
  // Fetch full memory content
  const { data: memories } = await supabase
    .from('memory_entries')
    .select('*')
    .in('id', clusterIds);

  if (!memories || memories.length < 3) return false;

  // Generate summary using LLM
  const contents = memories.map(m => `- ${m.content}`).join('\n');
  const category = memories[0].category;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'Synthesize these related memories into a single, concise summary that captures the key information. Output only the summary, no preamble.'
    }, {
      role: 'user',
      content: `Category: ${category}\n\nMemories:\n${contents}`
    }],
    max_tokens: 200,
  });

  const summary = response.choices[0].message.content;
  if (!summary) return false;

  // Create consolidated memory
  const embedding = await generateEmbedding(summary);

  await supabase.from('memory_entries').insert({
    user_id: memories[0].user_id,
    category,
    content: summary,
    confidence: Math.max(...memories.map(m => m.confidence)),
    source_type: 'consolidated',
    consolidated_from: clusterIds,
    embedding,
    memory_type: 'semantic',
  });

  // Mark originals as consolidated (soft delete with reason)
  await supabase
    .from('memory_entries')
    .update({
      is_active: false,
      deleted_reason: 'consolidated',
      deleted_at: new Date().toISOString(),
    })
    .in('id', clusterIds);

  return true;
}

/**
 * Find potentially contradicting memories
 */
async function findContradictions(userId: string): Promise<Array<{
  memory1: string;
  memory2: string;
  reason: string;
}>> {
  // Use LLM to detect contradictions in same-category memories
  // Implementation depends on scale - could use embedding clusters + LLM verification
  // Simplified: Return empty for now, implement with LLM batch processing
  return [];
}

/**
 * Prune old, unused, low-confidence memories
 */
async function pruneStaleMemories(
  userId: string,
  options: { maxAgeWithoutAccess: number; minConfidence: number }
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - options.maxAgeWithoutAccess);

  const { data } = await supabase
    .from('memory_entries')
    .update({
      is_active: false,
      deleted_reason: 'pruned_stale',
      deleted_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_active', true)
    .lt('confidence', options.minConfidence)
    .lt('last_accessed', cutoffDate.toISOString())
    .eq('access_count', 0)
    .select('id');

  return data?.length || 0;
}
```

### 8.4 Updated Memory Tools

```typescript
// lib/agent-sdk/memory-tools-v2.ts

/**
 * Enhanced search_memory with context awareness
 */
export const searchMemoryToolV2 = {
  name: 'search_memory',

  description: `Search the user's memories to find relevant information.
Automatically considers conversation context for better results.
Returns memories ranked by relevance, recency, and importance.`,

  parameters: z.object({
    query: z.string().min(1).max(500),
    category: z.enum(MEMORY_CATEGORIES).optional(),
    limit: z.number().min(1).max(10).default(5),
    includeNeighbors: z.boolean().default(true)
      .describe('Include related memories via spreading activation'),
  }),

  execute: async ({
    query,
    category,
    limit = 5,
    includeNeighbors = true,
    // Injected by handler
    conversationContext = [],
  }: SearchMemoryParams): Promise<string> => {
    try {
      // Build contextual query
      const contextualText = conversationContext.length > 0
        ? [...conversationContext.slice(-3), query].join('\n')
        : query;

      const embedding = await generateEmbedding(contextualText);

      // Use spreading activation if neighbors requested
      const searchFn = includeNeighbors
        ? 'spreading_activation_search'
        : 'enhanced_memory_search';

      const { data: memories, error } = await supabase.rpc(searchFn, {
        query_embedding: embedding,
        query_text: query,
        match_count: limit,
        p_user_id: DEFAULT_USER_ID,
        p_category: category ?? null,
      });

      if (error) throw error;
      if (!memories?.length) return 'No matching memories found.';

      // Update access metrics for retrieved memories
      const retrievedIds = memories.map(m => m.id);
      await updateAccessMetrics(retrievedIds);

      // Format results
      const results = memories
        .map((m, i) => {
          const hopInfo = m.hop_distance > 0 ? ' (related)' : '';
          return `[${i + 1}] ${m.category}: "${m.content}"${hopInfo} (id: ${m.id})`;
        })
        .join('\n');

      return `Found ${memories.length} memories:\n${results}`;
    } catch (error) {
      memoryLogger.error('[search_memory] Failed:', error);
      return `Memory search failed. Please try again.`;
    }
  },
};

/**
 * Enhanced remember_fact with Hebbian reinforcement
 */
export const rememberFactToolV2 = {
  name: 'remember_fact',

  description: `Store or reinforce a fact about the user.
If a similar memory exists, it will be strengthened rather than duplicated.
This mimics biological memory where repetition strengthens recall.`,

  parameters: z.object({
    category: z.enum(MEMORY_CATEGORIES),
    content: z.string().min(10).max(500),
    confidence: z.number().min(0.5).max(1.0).default(0.8),
    importance: z.number().min(0).max(1.0).default(0.5)
      .describe('How important is this information? 0=trivial, 1=critical'),
  }),

  execute: async ({
    category,
    content,
    confidence = 0.8,
    importance = 0.5,
  }: RememberFactParams): Promise<string> => {
    try {
      // Check for similar memories
      const duplicates = await findSimilarMemories(content, 0.80);

      if (duplicates.length > 0) {
        const existing = duplicates[0];

        // REINFORCE existing memory (Hebbian principle)
        const newConfidence = Math.min(1.0, existing.confidence + 0.05);
        const newImportance = Math.max(existing.importance || 0.5, importance);

        await supabase
          .from('memory_entries')
          .update({
            confidence: newConfidence,
            importance: newImportance,
            access_count: (existing.access_count || 0) + 1,
            last_mentioned: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          })
          .eq('id', existing.id);

        memoryLogger.info('[remember_fact] Reinforced existing memory:', existing.id);

        return `Reinforced existing memory: "${existing.content}"\n` +
               `Category: ${existing.category}\n` +
               `Confidence: ${existing.confidence.toFixed(2)} → ${newConfidence.toFixed(2)}\n` +
               `(Memory strengthened through repetition)`;
      }

      // Create new memory
      const embedding = await generateEmbedding(content);
      const contentHash = generateContentHash(content);

      const { data: memory, error } = await supabase
        .from('memory_entries')
        .insert({
          user_id: DEFAULT_USER_ID,
          category,
          content,
          confidence,
          importance,
          source_type: 'agent_tool',
          memory_type: 'semantic',
          content_hash: contentHash,
          embedding,
          access_count: 1,
          last_accessed: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Build relationship edges (background)
      supabase.rpc('build_memory_edges', {
        p_memory_id: memory.id,
        p_embedding: embedding,
        p_user_id: DEFAULT_USER_ID,
      }).then(() => {
        memoryLogger.debug('[remember_fact] Built memory edges for:', memory.id);
      });

      return `Remembered: "${content}"\n` +
             `Category: ${category}\n` +
             `Confidence: ${confidence.toFixed(2)}\n` +
             `Importance: ${importance.toFixed(2)}\n` +
             `(id: ${memory.id})`;
    } catch (error) {
      memoryLogger.error('[remember_fact] Failed:', error);
      return `Memory operation failed. Please try again.`;
    }
  },
};

/**
 * Update access metrics for retrieved memories
 */
async function updateAccessMetrics(memoryIds: string[]): Promise<void> {
  await supabase.rpc('update_memory_access', {
    p_memory_ids: memoryIds,
  });
}
```

---

## 9. References

### Neuroscience & Cognitive Psychology

1. **Atkinson, R.C. & Shiffrin, R.M.** (1968). Human memory: A proposed system and its control processes. *Psychology of Learning and Motivation*, 2, 89-195.

2. **Baddeley, A.D. & Hitch, G.** (1974). Working memory. *Psychology of Learning and Motivation*, 8, 47-89.

3. **Baddeley, A.** (2000). The episodic buffer: A new component of working memory? *Trends in Cognitive Sciences*, 4(11), 417-423.

4. **Bjork, R.A. & Bjork, E.L.** (1992). A new theory of disuse and an old theory of stimulus fluctuation. *From Learning Processes to Cognitive Processes*, 2, 35-67.

5. **Bower, G.H.** (1981). Mood and memory. *American Psychologist*, 36(2), 129-148.

6. **Collins, A.M. & Loftus, E.F.** (1975). A spreading-activation theory of semantic processing. *Psychological Review*, 82(6), 407-428.

7. **Cowan, N.** (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, 24(1), 87-114.

8. **Craik, F.I.M. & Lockhart, R.S.** (1972). Levels of processing: A framework for memory research. *Journal of Verbal Learning and Verbal Behavior*, 11(6), 671-684.

9. **Ebbinghaus, H.** (1885). *Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie*. Leipzig: Duncker & Humblot.

10. **Frankland, P.W. & Bontempi, B.** (2005). The organization of recent and remote memories. *Nature Reviews Neuroscience*, 6(2), 119-130.

11. **Godden, D.R. & Baddeley, A.D.** (1975). Context-dependent memory in two natural environments: On land and underwater. *British Journal of Psychology*, 66(3), 325-331.

12. **Hebb, D.O.** (1949). *The Organization of Behavior*. New York: Wiley.

13. **Marr, D.** (1971). Simple memory: A theory for archicortex. *Philosophical Transactions of the Royal Society B*, 262(841), 23-81.

14. **McClelland, J.L., McNaughton, B.L., & O'Reilly, R.C.** (1995). Why there are complementary learning systems in the hippocampus and neocortex. *Psychological Review*, 102(3), 419-457.

15. **McNaughton, B.L. & Morris, R.G.M.** (1987). Hippocampal synaptic enhancement and information storage within a distributed memory system. *Trends in Neurosciences*, 10(10), 408-415.

16. **Meyer, D.E. & Schvaneveldt, R.W.** (1971). Facilitation in recognizing pairs of words: Evidence of a dependence between retrieval operations. *Journal of Experimental Psychology*, 90(2), 227-234.

17. **Nader, K., Schafe, G.E., & Le Doux, J.E.** (2000). Fear memories require protein synthesis in the amygdala for reconsolidation after retrieval. *Nature*, 406(6797), 722-726.

18. **Sperling, G.** (1960). The information available in brief visual presentations. *Psychological Monographs*, 74(11), 1-29.

19. **Squire, L.R. & Zola-Morgan, S.** (1991). The medial temporal lobe memory system. *Science*, 253(5026), 1380-1386.

20. **Tulving, E.** (1972). Episodic and semantic memory. In E. Tulving & W. Donaldson (Eds.), *Organization of Memory* (pp. 381-403). New York: Academic Press.

21. **Tulving, E.** (1985). Memory and consciousness. *Canadian Psychology*, 26(1), 1-12.

22. **Tulving, E.** (2002). Episodic memory: From mind to brain. *Annual Review of Psychology*, 53(1), 1-25.

23. **Tulving, E. & Thomson, D.M.** (1973). Encoding specificity and retrieval processes in episodic memory. *Psychological Review*, 80(5), 352-373.

24. **Walker, M.P. & Stickgold, R.** (2004). Sleep-dependent learning and memory consolidation. *Neuron*, 44(1), 121-133.

### Neural Networks & AI

25. **Borgeaud, S. et al.** (2022). Improving language models by retrieving from trillions of tokens. *ICML 2022*.

26. **Graves, A., Wayne, G., & Danihelka, I.** (2014). Neural Turing Machines. *arXiv:1410.5401*.

27. **Graves, A. et al.** (2016). Hybrid computing using a neural network with dynamic external memory. *Nature*, 538(7626), 471-476.

28. **Lewis, P. et al.** (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *NeurIPS 2020*.

29. **Packer, C. et al.** (2023). MemGPT: Towards LLMs as Operating Systems. *arXiv:2310.08560*.

30. **Park, J.S. et al.** (2023). Generative Agents: Interactive Simulacra of Human Behavior. *UIST 2023*.

31. **Vaswani, A. et al.** (2017). Attention Is All You Need. *NeurIPS 2017*.

32. **Weston, J., Chopra, S., & Bordes, A.** (2015). Memory Networks. *ICLR 2015*.

---

## 10. Appendices

### Appendix A: Schema Migration Script

```sql
-- Migration: Add cognitive memory enhancements
-- File: YYYYMMDD_cognitive_memory_v1.sql

-- 1. Temporal dynamics columns
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS access_count INT DEFAULT 0;

-- 2. Importance scoring
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS importance FLOAT DEFAULT 0.5
    CHECK (importance >= 0 AND importance <= 1);

-- 3. Memory type distinction
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS memory_type VARCHAR(20) DEFAULT 'semantic'
    CHECK (memory_type IN ('episodic', 'semantic', 'consolidated'));

-- 4. Episodic context
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS episode_context JSONB;

-- 5. Consolidation tracking
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS consolidated_from UUID[];

-- 6. Update source_type constraint
ALTER TABLE memory_entries
  DROP CONSTRAINT IF EXISTS memory_entries_source_type_check;

ALTER TABLE memory_entries
  ADD CONSTRAINT memory_entries_source_type_check
  CHECK (source_type IN ('manual', 'extracted', 'suggested', 'agent_tool', 'consolidated'));

-- 7. Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_memory_entries_last_accessed
  ON memory_entries(user_id, last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_memory_entries_access_count
  ON memory_entries(user_id, access_count DESC);
CREATE INDEX IF NOT EXISTS idx_memory_entries_importance
  ON memory_entries(user_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_memory_entries_memory_type
  ON memory_entries(user_id, memory_type);

-- 8. Helper function to update access metrics
CREATE OR REPLACE FUNCTION update_memory_access(p_memory_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE memory_entries
  SET
    last_accessed = NOW(),
    access_count = access_count + 1
  WHERE id = ANY(p_memory_ids);
END;
$$;

-- 9. Comments
COMMENT ON COLUMN memory_entries.last_accessed IS 'Timestamp of last retrieval (for recency weighting)';
COMMENT ON COLUMN memory_entries.access_count IS 'Number of times memory was retrieved (for frequency weighting)';
COMMENT ON COLUMN memory_entries.importance IS 'User-facing importance score (0=trivial, 1=critical)';
COMMENT ON COLUMN memory_entries.memory_type IS 'episodic (with context), semantic (decontextualized), consolidated (merged)';
COMMENT ON COLUMN memory_entries.episode_context IS 'JSON context for episodic memories: {chat_id, timestamp, topic, emotional_valence}';
COMMENT ON COLUMN memory_entries.consolidated_from IS 'Array of memory IDs that were consolidated into this memory';
```

### Appendix B: Test Queries

```sql
-- Verify temporal weighting works
SELECT id, content,
  (1 - (embedding <=> '[query_embedding]')) as vector_score,
  EXP(-0.693 * EXTRACT(EPOCH FROM NOW() - last_accessed) / (30 * 86400)) as recency_score,
  LN(1 + access_count) / LN(100) as frequency_score
FROM memory_entries
WHERE is_active = true
ORDER BY vector_score DESC
LIMIT 10;

-- Check memory relationship graph
SELECT
  s.content as source_content,
  t.content as target_content,
  r.relationship_type,
  r.strength
FROM memory_relationships r
JOIN memory_entries s ON r.source_id = s.id
JOIN memory_entries t ON r.target_id = t.id
WHERE s.user_id = '[user_id]'
ORDER BY r.strength DESC
LIMIT 20;

-- Consolidation candidates
SELECT
  m1.id as id1,
  m2.id as id2,
  m1.content as content1,
  m2.content as content2,
  (1 - (m1.embedding <=> m2.embedding)) as similarity
FROM memory_entries m1
JOIN memory_entries m2 ON m1.id < m2.id
  AND m1.category = m2.category
  AND m1.user_id = m2.user_id
WHERE m1.is_active = true
  AND m2.is_active = true
  AND (1 - (m1.embedding <=> m2.embedding)) > 0.75
ORDER BY similarity DESC
LIMIT 20;
```

### Appendix C: Monitoring Queries

```sql
-- Memory system health dashboard

-- 1. Memory distribution by type and category
SELECT
  category,
  memory_type,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence,
  AVG(importance) as avg_importance,
  AVG(access_count) as avg_access_count
FROM memory_entries
WHERE is_active = true
GROUP BY category, memory_type
ORDER BY category, memory_type;

-- 2. Stale memory candidates (never accessed, old)
SELECT COUNT(*) as stale_count
FROM memory_entries
WHERE is_active = true
  AND access_count = 0
  AND created_at < NOW() - INTERVAL '30 days';

-- 3. Consolidation opportunities
SELECT COUNT(*) as cluster_pair_count
FROM memory_entries m1
JOIN memory_entries m2 ON m1.id < m2.id
WHERE m1.is_active = true AND m2.is_active = true
  AND m1.category = m2.category
  AND (1 - (m1.embedding <=> m2.embedding)) > 0.75;

-- 4. Memory growth rate (last 7 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as memories_created
FROM memory_entries
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- 5. Most accessed memories
SELECT id, category, content, access_count, last_accessed
FROM memory_entries
WHERE is_active = true
ORDER BY access_count DESC
LIMIT 10;
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-28 | AI Architecture Team | Initial research report |

---

*This document is intended as a living reference for the Bobo memory system evolution. Updates should be made as implementation progresses and new research becomes available.*
