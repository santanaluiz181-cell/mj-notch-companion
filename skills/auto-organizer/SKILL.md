---
name: auto-organizer
description: Deterministic context-checkpoint protocol via organizer.md to prevent LLM degradation and enable instant clean-boot session handoffs.
---

# Auto-Organizer Checkpoint Protocol

Maintain continuity across long coding or research sessions by writing a crisp `organizer.md` checkpoint at the workspace root before context saturation causes drift.

## 1. Trigger Conditions

Pause new edits and update `./organizer.md` when any of the following occurs:

1. **Context Window Budget:** Session reaches ~70,000 tokens or 25 continuous tool turns.
2. **Verified Milestone:** A coherent module passes all automated build, lint, and unit/mutation tests with exit code 0.
3. **Early Drift Signal:** Repeated tool retries without progress or stale recall of file paths.

## 2. Canonical `organizer.md` Schema

```markdown
# AUTO-ORGANIZER CHECKPOINT

## 1. Overall Goal
[One crisp sentence describing the system objective.]

## 2. Modified Files
- `relative/path.ext` - [Created / Updated / Refactored]

## 3. Architectural Decisions
- [Pattern or library chosen and why alternatives were excluded.]

## 4. Current State
- **Working:** [Verified components and exact test exit codes.]
- **Open:** [Remaining edge cases or next deliverables.]

## 5. Immediate Next Step
[Exact file path, symbol, and verification command for the next fresh session.]
```

## 3. Clean Boot Handoff

Open a fresh session with:
> "Read `organizer.md` at the repository root, load the active technical state immediately, and execute the Immediate Next Step without generic confirmations."
