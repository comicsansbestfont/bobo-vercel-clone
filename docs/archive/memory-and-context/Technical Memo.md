# **Technical Memo: Implementing the "Double-Loop" Memory**

To: Engineering Team  
Context: Supporting the "Holistic Second Brain" Strategy

## **1\. The Core Challenge**

We need to solve the problem of **Data Pollution** (confusing Client A with Client B) while enabling **Pattern Recognition** (applying Client A's strategy to Client B).

Standard RAG (Retrieval Augmented Generation) treats all retrieved chunks equally. We must implement a **Tiered Context System**.

## **2\. The "Double-Loop" Architecture**

We will execute two distinct retrieval operations for every user query.

### **Layer A: The "Project Loop" (High-Fidelity)**

* **Source:** project\_files (via Context Caching) OR pgvector (filtered by project\_id).  
* **Mechanism:** If total project context \< 100k tokens, inject FULL text into System Prompt (Cached). If \> 100k, use RAG.  
* **Purpose:** Hard facts, specific deliverables, constraints.

### **Layer B: The "Global Loop" (Associative)**

* **Source:** pgvector (searching chats and project\_files).  
* **Filter:** project\_id \!= current\_project\_id.  
* **Mechanism:** Semantic Search (Cosine Similarity).  
* **Threshold:** Only retrieve chunks with Similarity \> 0.82 (High relevance bar).  
* **Purpose:** Patterns, strategies, tone, past ideas.

## **3\. The Implementation Details**

### **A. Supabase RPC Function (Holistic Search)**

We need a custom SQL function in Supabase to handle the weighted search logic.

\-- CONCEPTUAL SQL LOGIC  
create or replace function hybrid\_search (  
  query\_embedding vector(1536),  
  match\_threshold float,  
  match\_count int,  
  active\_project\_id uuid  
)  
returns table (  
  id uuid,  
  content text,  
  similarity float,  
  source\_type text \-- 'project' or 'global'  
)  
language plpgsql  
as $$  
begin  
  return query  
  select  
    id,  
    content,  
    1 \- (embedding \<=\> query\_embedding) as similarity,  
    case  
      when project\_id \= active\_project\_id then 'project'  
      else 'global'  
    end as source\_type  
  from documents  
  where 1 \- (embedding \<=\> query\_embedding) \> match\_threshold  
  \-- Boost project matches by artificially inflating similarity or ordering  
  order by  
    (case when project\_id \= active\_project\_id then 1 else 0 end) desc, \-- Prioritize Project matches  
    similarity desc  
  limit match\_count;  
end;  
$$;

### **B. The Context-Aware System Prompt**

The most critical part is how we present this data to the LLM. We must clearly demarcate the "Truth" from the "Inspiration."

\# SYSTEM PROMPT

You are Bobo, an intelligent Second Brain.

\#\# 1\. ACTIVE PROJECT CONTEXT (High Priority)  
The user is currently working on: {{project\_name}}  
The following information is AUTHORITATIVE FACTS for this project:  
\<project\_context\>  
{{retrieved\_project\_chunks}}  
\</project\_context\>  
INSTRUCTION: Use these details for all specific names, dates, and deliverables.

\#\# 2\. RELEVANT MEMORY & ASSOCIATIONS (Low Priority)  
The following information is from the user's PAST WORK.  
\<global\_context\>  
{{retrieved\_global\_chunks}}  
\</global\_context\>  
INSTRUCTION: These are for INSPIRATION and PATTERN MATCHING.  
\- If the user asks for a strategy, look here for what worked before.  
\- If the user is writing content, look here for connecting ideas.  
\- WARNING: Do NOT use names or specific data points from this section unless explicitly asked.

## **4\. Context Caching Integration (Anthropic Specific)**

For the Project Loop, we will use Anthropic's Beta "Prompt Caching".

**Logic Flow:**

1. User opens Project A.  
2. Backend checks Project A total file size.  
3. **If size \< 200k tokens:**  
   * Construct a System Message containing all project files.  
   * Add cache\_control: {"type": "ephemeral"} to the end of the text block.  
   * Send this as the "Base Prompt" for the chat session.  
4. **If size \> 200k tokens:**  
   * Trigger standard RAG pipeline (Layer A above).

**Cost Benefit:**

* First load: Full price.  
* Subsequent chats: \~90% discount and 2x speed.  
* This makes "Forever Context" economically viable.

## **5\. Recommendation**

We recommend prioritizing the **Anthropic Context Caching** integration for Milestone 2\. It provides the highest "Wow Factor" for the least engineering effort compared to tuning a complex RAG system from scratch.