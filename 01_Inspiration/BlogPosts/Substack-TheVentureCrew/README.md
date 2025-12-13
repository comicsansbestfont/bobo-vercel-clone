# The Venture Crew - Substack Blog Backup

## Source Information
- **Publication**: The Venture Crew
- **Platform**: Substack
- **URL**: https://theventurecrew.substack.com
- **Author**: Sahil (The Venture Crew)
- **Created**: 2025-12-02

## Content Overview
This folder contains backed-up blog posts from The Venture Crew Substack newsletter, focused on startup fundraising, venture capital, and founder resources.

**Topics covered include:**
- VC fundraising strategies and frameworks
- Pitch deck guidance (Y Combinator frameworks)
- Valuation and term sheet negotiation
- Product-market fit metrics
- Startup metrics and benchmarks
- Investor databases and resources

## Folder Structure
```
Substack-TheVentureCrew/
├── README.md                    # This file
├── *.md                         # Individual blog posts (URL slug naming)
```

## Statistics
- **Total Posts**: 179
- **Date Range**: May 2023 - December 2025
- **Status**: Complete

## Metadata Format
All posts include YAML frontmatter:
```yaml
---
title: "Post Title"
source_url: "https://theventurecrew.substack.com/p/post-slug"
date_published: "YYYY-MM-DD"
status: "extracted"
---
```

## File Naming Convention
Files are named using the URL slug format:
- `the-metric-that-predicts-ai-product.md`
- `y-combinator-pitch-deck-framework.md`
- `how-to-win-in-a-crowded-market-and.md`

## Extraction Details
- **Method**: Utilities/content_pipeline.py
- **Sitemap URL**: https://theventurecrew.substack.com/sitemap.xml
- **URL Filter**: `/p/` (standard Substack post pattern)
- **Extracted**: 2025-12-02

## Usage
Search these posts using the RAG system:
```bash
python Utilities/search_blog.py "fundraising" --stage Inspiration
python Utilities/search_blog.py "pitch deck" --stage Inspiration
```
