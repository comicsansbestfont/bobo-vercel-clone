# **Product Strategy Brief: Memory & Context Architecture**

Project: Bobo AI Chatbot  
Date: November 23, 2025  
To: Product Manager  
From: Engineering / Strategy  
Subject: Solving the "Second Brain" Problem – Architecture & Recommendations

## **1\. Executive Summary**

The core value proposition of Bobo AI is to serve as a "Second Brain" for knowledge workers. Currently, the market is split between "Project Tools" (Claude) that offer deep but isolated context, and "Personal Companions" (ChatGPT) that offer broad but shallow memory.

**The Opportunity:** Bobo AI can bridge this gap by implementing a **"Holistic Context" architecture**. This allows users to maintain strict factual isolation for their projects (e.g., "Company A Pricing") while leveraging wisdom and patterns from their entire history (e.g., "The negotiation strategy I used for Company B").

This document outlines the market landscape, the recommended hybrid architecture, and the strategic decisions required for Milestone 2 and 3\.

## **2\. Market Landscape: How the Giants Solve "Memory"**

To understand our differentiation, we must look at how the two leaders handle user context.

### **A. Anthropic (Claude) – The "Deep Work" Model**

* **Philosophy:** **Isolation & Depth.** Claude assumes you are working on a specific task that requires massive context (e.g., a 100-page codebase).  
* **Key Feature:** **Project Workspaces.** Users upload files to a "Project."  
* **Technical Enabler:** **Context Caching.** Instead of searching for snippets (RAG), Claude "pins" the entire knowledge base into the active memory (RAM).  
* **Pros:** Incredible reasoning capabilities; understands the "whole picture."  
* **Cons:** **Siloed.** Information in "Project A" is invisible to "Project B." The AI cannot connect dots across your life.

### **B. OpenAI (ChatGPT) – The "Companion" Model**

* **Philosophy:** **Continuity & Breadth.** ChatGPT assumes you are the same person across all chats.  
* **Key Feature:** **"Bio" Memory.** It scans chats in the background to learn facts about you (e.g., "User is a Python dev").  
* **Technical Enabler:** **Background Extraction & Search.** It builds a persistent profile injected into every chat.  
* **Pros:** Feels personal; remembers preferences globally.  
* **Cons:** **Shallow.** It creates a caricature of the user but struggles to recall deep technical details from past projects without manual searching.

## **3\. The Bobo AI Strategy: "The Double-Loop"**

We will not choose between "Project Depth" and "Global Breadth." We will implement a **Hybrid Architecture** that treats a Project as a **Lens**, not a Wall.

### **The "Usefulness" Case**

Why do we need this? Consider two scenarios defined by our core user persona:

#### **Scenario A: Deal Management (The "Wisdom" Transfer)**

* **Context:** User is working in **Project: Company B** managing a deal.  
* **The Problem:** User faces an objection about implementation timelines.  
* **The "Isolated" Failure:** If we only look at Company B's data, the AI has no answer.  
* **The "Holistic" Win:** The system detects a similar objection was successfully handled in **Project: Company A** six months ago. It retrieves that *strategy* (not the confidential data) and suggests applying it here.

#### **Scenario B: Content Strategy (The "Bridge")**

* **Context:** User is writing an article in **Project: Topic B**.  
* **The "Holistic" Win:** As the user types, the AI recalls a "Draft Idea" from **Project: Topic A** that was never published. It suggests repurposing that unused content to bridge the two topics, maximizing the user's intellectual output.

## **4\. Strategic Recommendations**

### **Recommendation 1: Adopt "Context Caching" for Projects (Milestone 2\)**

Instead of relying solely on RAG (chunking files into tiny pieces), we should use **Anthropic's Context Caching** for active projects.

* **Why:** RAG breaks the narrative flow of documents. Context Caching keeps the document whole.  
* **Implementation:** When a user enters a Project, we "pin" the core documents (up to \~100k tokens) into the cache. This gives "Claude-level" intelligence within the project.

### **Recommendation 2: Implement "Global Associative Search" (Milestone 3\)**

We must implement a secondary search loop that runs across *all* user data, regardless of project.

* **Constraint:** This search must be **weighted**.  
  * *Primary Loop (Project Data):* High confidence, used for facts/specs.  
  * *Secondary Loop (Global Data):* Lower confidence, used for patterns/ideas.  
* **Safety:** The prompt must explicitly instruct the AI: "Use Global Data for inspiration/patterns only. Do not mix up client names or confidential facts."

### **Recommendation 3: Use Managed Memory for the "Bio" Layer**

Do not build the "User Profile" extraction from scratch.

* **Tool:** **Supermemory.ai** (or Mem0).  
* **Why:** They handle the complex logic of "updating" facts (e.g., changing "I live in Sydney" to "I live in Bali") which is difficult to code manually.

## **5\. Decision Matrix for Product Manager**

| Decision | Option A (Simple) | Option B (Bobo Recommended) | Impact |
| :---- | :---- | :---- | :---- |
| **Project Context** | **Standard RAG:** Chunk files and search for keywords. | **Context Caching:** Load full docs into memory (via Anthropic API). | **Option B** creates a vastly smarter AI that understands nuance, justifying the "Second Brain" claim. |
| **Search Scope** | **Isolated:** Search only within the active Project. | **Holistic:** Weighted search across Project \+ Global Archive. | **Option B** enables the "Deal Management" and "Content Repurposing" use cases. |
| **Implementation** | **Build In-House:** Write our own vector/memory logic. | **Hybrid Stack:** Supabase (Vectors) \+ Supermemory (Bio). | **Hybrid Stack** reduces dev time by \~4 weeks and improves reliability. |

## **6\. Next Steps**

1. **Approve Milestone 2 Architecture:** Shift from pure RAG to "Context Caching First" approach.  
2. **Approve "Double-Loop" Logic:** Authorize engineering to design the prompt structure that handles two distinct context streams.  
3. **Review Technical Memo:** See technical\_architecture\_memory.md for the implementation details.