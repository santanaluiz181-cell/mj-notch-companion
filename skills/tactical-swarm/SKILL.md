---
name: tactical-swarm
description: Queen + Tactical Swarm orchestration topology for specialized multi-agent dispatch (1 to 3 active workers per cycle) synced live with MJ Notch Companion (:49211).
---

# Tactical Swarm - Queen + 16 Specialists

Hierarchical multi-agent routing designed to prevent quota exhaustion and context bloat. Only the Queen Coordinator holds the global dependency graph while summoning **1 to 3 specialists per cycle**.

## 1. Specialist Roster

| Key | Role | Model Tier | Responsibility |
|---|---|---|---|
| `research` | **Scout AST** | `flash_lite` | Symbol location, dependency graphs, 5-15 line extracts |
| `sonar` | **Sonar Researcher** | `flash_lite` | Primary documentation and upstream reference search |
| `cartographer` | **Cartographer** | `flash_lite` | Static architecture mapping and `PROJECT_MAP.md` |
| `coder` | **Backend Coder** | `flash` | APIs, Win32/system code, core logic under strict write scope |
| `ui_craftsman` | **UI Craftsman** | `flash` | Design tokens, layout geometry, accessible responsive UI |
| `refactorer` | **Deep Refactorer** | `flash_lite` | Deep modules, shallow nesting, zero logic duplication |
| `media_dsp` | **Media & DSP** | `flash` | Procedural WAV audio, EBU R128 loudness, FFmpeg/Canvas video |
| `tester` | **Tester QA** | `flash_lite` | Automated suites plus negative / mutation assertions |
| `reviewer` | **Code Auditor** | `flash_lite` | Two-axis audit (Standards vs Spec) |
| `security` | **Security Guardrail** | `flash_lite` | Secret scanning, input bounds, Unicode sanitization |
| `profiler` | **Profiler 60FPS** | `flash_lite` | Frame drops, memory leaks, timer lifecycle checks |
| `docs_curator` | **Docs Curator** | `flash` | Cross-referencing READMEs, guides, and workspace specs |
| `copy_editor` | **Copy & Transcript** | `flash` | Summaries, structured quotes, multilingual copy |
| `spec_auditor` | **Spec Auditor** | `flash` | API contract, contrast, and build gate verification |
| `organizer` | **Auto-Organizer** | `flash_lite` | `organizer.md` maintenance and clean boot continuity |
| `self` | **Queen Coordinator** | `pro` | Task decomposition and final verification synthesis |

## 2. MJ Notch Live Telemetry Hook

MJ Notch listens on `http://127.0.0.1:49211`:
- `POST /summon_subagent` / `POST /subagent_update`: mirrors worker role, tool, and status onto the Floating Pill / AppBar Swarm Inspector (`Ctrl+Alt+S`).
- `POST /tool_pending_approval`: triggers instant desktop/mobile Allow / Always / Deny prompt.
