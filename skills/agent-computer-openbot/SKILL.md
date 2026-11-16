---
name: agent-computer-openbot
description: Co-automation triad [Browser | Filesystem | Terminal] with human-in-the-loop 'Take the Wheel' authority handoff over MJ Notch IPC.
---

# Agent-Computer OpenBot

Governs desktop automation across three bounded surfaces:

1. **Browser (CDP / Playwright):** Structured DOM inspection and client-side verification. Never submit irreversible actions without explicit user confirmation.
2. **Filesystem:** Sliced reads, UTF-8 handling, and Unicode zero-width character sanitization before release.
3. **Terminal:** Deterministic build/test verification with fail-fast exit codes.

## Human-in-the-Loop Handshake (:49211)
- `POST /agent_event` with `computer.help_requested` alerts the user in MJ Notch so they can assume control manually ("Take the Wheel") and resume cleanly afterward.
