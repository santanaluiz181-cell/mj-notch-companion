---
name: graphify-claude-mem
description: Structural AST index + local SQLite persistent memory workflow to eliminate blind repository scans and cut input tokens by 65%+.
---

# Graphify + Local Persistent Memory Bridge

Combines lightweight AST symbol indexing with local persistent session memory (`work_state_write` / `save_memory`).

## Workflow

1. **Index Once:** Build a structural symbol table mapping files, classes, functions, and exact line bounds.
2. **Persist Topology:** Store top hub symbols and architectural notes in local SQLite memory so new sessions skip exploratory `find`/`grep` storms.
3. **Sliced Reads Only:** Open targeted 40-100 line windows around exact symbol line numbers instead of ingesting whole multi-thousand-line files.
