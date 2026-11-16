---
name: mj-notch-companion
description: Integrate any coding agent or automation daemon with MJ Notch Companion v9.0 over local HTTP IPC (:49211) and LAN Gateway (:49212).
---

# MJ Notch Companion v9.0 - IPC & Automation Skill

Connect local AI agents, Playwright runners, or Mercury Agent (`127.0.0.1:6174`) to **MJ Notch Companion**.

## Key Local Endpoints (`http://127.0.0.1:49211`)

- `GET /antigravity_status`: live CPU/GPU, quota, active subagents, and timer/habit state.
- `POST /mascot_greeting`: display crisp bubble notification (`{"message": "Build passing", "duration": 2.5}`).
- `POST /mascot_state`: trigger mascot reaction (`happy`, `working`, `coffee`, `wink`, `apurando`, `sucesso`).
- `POST /stage_context_file`: stage files from desktop drag-and-drop or Edge File Shelf.
- `POST /trigger_flight`: glide companion across multi-monitor edges (`{"direction": "left|right"}`).
- `POST /toggle_appbar`: toggle Floating Pill (`#F7F4EE`) <-> Docked AppBar (`#111113`).

## Desktop Shortcuts
- `Ctrl+Alt+A`: Toggle Pill <-> AppBar
- `Ctrl+Alt+T`: Open ExpandPillTimers (Pomodoro & Daily Habits)
- `Ctrl+Alt+S`: Open Tactical Swarm Subagent Inspector
- `Ctrl+Alt+J`: Open Verification / Fact-Check Engine
- `Ctrl+Alt+G`: Open Skin Wardrobe & 16-Agent Dormitory
