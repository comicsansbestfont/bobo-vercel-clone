# Advisory Files

Local repository of deal and client documentation for Bobo's advisory search.

## Structure
- `deals/[Company]/` - Deal documentation (master-doc, meetings, comms)
- `clients/[Company]/` - Client profiles and engagement history

## Companies

### Deals
- ArcheloLab
- ControlShiftAI
- MyTab
- SwiftCheckin
- Talvin
- Tandm

### Clients
- SwiftCheckin

## Syncing

After modifying files, run:
```bash
npm run index-advisory
```

## Indexed Files

~52 markdown files with embeddings in Supabase `files` table.

The `search_advisory` agent tool performs hybrid search (70% vector + 30% text) on these files.
