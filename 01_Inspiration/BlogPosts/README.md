# Blog Posts Backup

**Last Updated:** November 11, 2025  
**Purpose:** Centralized backup repository for blog posts from various sources

---

## Overview

This directory contains backed-up blog posts from multiple sources, organized by platform or site. These backups serve as:

1. **Archive copies** of published content
2. **Reference material** for content strategy
3. **Source content** for repurposing across channels
4. **Historical record** of blog evolution

---

## Current Sources

### 1. Substack-MrRunlocked (102 posts)

**Source:** https://www.mrrunlocked.com  
**Platform:** Substack  
**Date Range:** [Multiple years of content]  
**Status:** Extracted with metadata headers

Content covers GTM strategy, SaaS marketing, founder-led sales, and operational guides.

**README:** `Substack-MrRunlocked/README.md`

---

### 2. BasicArts (305 posts)

**Source:** BasicArts blog  
**Platform:** Custom/WordPress  
**Date Range:** [Multiple years]  
**Status:** Extracted with metadata headers

Large collection of blog posts with manifests available.

**Files:**
- `basicarts_posts_manifest.json` - Extraction metadata
- `basicarts_urls.csv` - Source URLs with lastmod dates

**README:** `BasicArts/README.md`

---

### 3. T2D3 (83 posts)

**Source:** T2D3 platform  
**Platform:** Various/Export  
**Status:** Unorganized backup

Collection of blog posts in markdown and docx formats. These files were imported from an unorganized export and may benefit from further categorization.

**README:** `T2D3/README.md`

---

## File Organization

### Standard Structure

Each source directory should contain:

```
SourceName/
├── README.md                    # Source information and metadata
├── manifest.json (optional)     # Extraction metadata
├── urls.csv (optional)          # Source URL list
└── *.md                         # Blog post markdown files
```

### Metadata Format

Blog post markdown files include YAML front matter:

```yaml
---
title: Post Title
source_url: https://example.com/post-slug
date_published: YYYY-MM-DD
notion_page_id: "" (if applicable)
migration_date: YYYY-MM-DD
status: extracted
---

# Post Title

Post content begins here...
```

---

## Adding New Blog Sources

To backup blog posts from a new source:

### Step 1: Extract Content

Use the `content_pipeline.py` utility from the workspace root:

```bash
cd "/Users/sacheeperera/VibeCoding Projects/Blog Migration"

python content_pipeline.py \
  --sitemap-url "https://example.com/sitemap.xml" \
  --save-markdown-dir "Content-backups/BlogPosts/NewSourceName" \
  --start-index 0 \
  --count 100
```

### Step 2: Create Source Directory

```bash
mkdir -p "Content-backups/BlogPosts/NewSourceName"
```

### Step 3: Add README

Create `NewSourceName/README.md` with:
- Source URL and platform
- Date range of content
- Number of posts
- Any special notes about the content

### Step 4: Save Metadata

If applicable, save manifests:
- `source_manifest.json` - Extraction results
- `source_urls.csv` - URL list with dates

---

## Using Blog Backups

### For Content Strategy

1. Review existing content themes and structures
2. Identify high-performing topics
3. Analyze content gaps
4. Plan content calendar based on patterns

### For Content Repurposing

1. Select relevant blog posts by topic
2. Use AI services (Claude, ChatGPT, Gemini) to:
   - Condense into LinkedIn posts
   - Extract key quotes
   - Create thread structures
   - Develop follow-up content
3. Save outputs to `Content-backups/Chats/`

### For Reference

- Quick lookup of published content
- Verify facts and figures from past posts
- Review writing style and tone evolution
- Check historical positioning

---

## Content Pipeline Features

The `content_pipeline.py` utility provides:

### Extraction
- Sitemap parsing (XML)
- Batch content fetching
- Metadata extraction (title, date, URL)

### Sanitization
- UI element removal
- Sponsor content filtering
- CTA and navigation cleanup
- Clean article content isolation

### Conversion
- HTML to Markdown
- Unicode handling
- Notion-flavored formatting
- Clean line wrapping

### Output
- Markdown files with YAML front matter
- JSON manifests with extraction metadata
- Progress reporting

---

## File Naming Conventions

### Post Files
- Use URL slug as filename: `post-title-here.md`
- Lowercase with hyphens
- No special characters except hyphens

### Manifest Files
- Source name + purpose: `source_posts_manifest.json`
- Source name + urls: `source_urls.csv`

### README Files
- Standard: `README.md` in each source directory

---

## Metadata Standards

### Required Fields
- `title`: Post title (string)
- `source_url`: Original URL (string)
- `date_published`: Publication date (YYYY-MM-DD)
- `status`: Extraction status (extracted, migrated, etc.)

### Optional Fields
- `notion_page_id`: Notion page ID if migrated (string)
- `migration_date`: Date extracted/backed up (YYYY-MM-DD)
- `author`: Post author (string)
- `tags`: Content tags (array)

---

## Best Practices

### Regular Backups
- Backup new content monthly or quarterly
- Update manifests with new posts
- Document any changes to source structure

### Quality Checks
- Spot-check random posts for content fidelity
- Verify metadata accuracy
- Ensure links are preserved
- Check formatting is clean

### Organization
- Keep source directories separate
- Don't mix content from different sources
- Maintain clear README files
- Update counts when adding/removing posts

---

## Troubleshooting

### Common Issues

**Issue:** Content extraction includes UI elements

**Solution:** Update sanitization rules in `content_pipeline.py` for the specific platform

---

**Issue:** Metadata missing or incorrect

**Solution:** Check sitemap format and adjust parsing logic

---

**Issue:** Markdown formatting issues

**Solution:** Review HTML to Markdown conversion settings in content_pipeline.py

---

## Resources

- **Content Pipeline Utility:** `/content_pipeline.py`
- **Main Workspace README:** `/README.md`
- **Notion Migration Archive:** `/Archive-Notion-Migration/documentation/`

---

## Statistics

| Source | Posts | Platform | Status |
|--------|-------|----------|--------|
| Substack-MrRunlocked | 102 | Substack | ✅ Complete |
| BasicArts | 305 | WordPress | ✅ Complete |
| T2D3 | 83 | Various | ✅ Complete |
| **Total** | **490** | - | - |

---

**Last Backup:** November 11, 2025  
**Total Storage:** 490 blog posts across 3 sources


