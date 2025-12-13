# Organized Content Outputs (Basic Arts)

**Created:** November 11, 2025  
**Purpose:** Organized Basic Arts blog post backups by migration status

---

## Folder Structure

```
content_outputs_organized-BA/
├── migrated/           (0 posts - reserved for future use)
└── not_migrated/       (305 posts - ready for migration)
```

---

## Metadata Headers

All files include YAML front matter:

```yaml
---
title: [Post Title]
source_url: [Original URL]
date_published: [YYYY-MM-DD]
notion_page_id: ""
migration_date: [YYYY-MM-DD]
status: extracted
---
```

---

## Files & Manifests

- URL source list: `basicarts_urls.csv` (columns: url, lastmod)
- Extraction manifest: `basicarts_posts_manifest.json` (url, title, lastmod, date_published, slug, file_path, markdown_length)

---

## Usage

To review output:

```bash
cd content_outputs_organized-BA/not_migrated/
ls -la
```

---

## Notes

- Images are not downloaded; references are preserved.
- Dates are taken from the provided “Last Mod.” values (date portion only).
- All posts are placed in `not_migrated/` until migrated to Notion.


