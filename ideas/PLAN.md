# InkAgent Hackathon Plan

## Project Name
InkAgent – Autonomous Writing Agent

## Pitch
"An AI agent that improves and continues stories autonomously, charges per execution, and logs verifiable proof of work on-chain."

## Description (for submission)

InkAgent is an autonomous AI writing agent that improves and continues long-form content with persistent context awareness.

The agent analyzes user input, generates structured narrative outputs, and executes paid actions per request. Each execution is settled via Kite's AI payments infrastructure and recorded on-chain for verifiable proof of work.

Unlike generic AI tools, InkAgent maintains continuity, narrative structure, and emotional coherence across outputs, enabling reliable content generation workflows.

The system runs end-to-end in production with a simple web interface, demonstrating agent autonomy, real-world applicability, and verifiable execution.

## Problem
AI writing tools are stateless and require repeated prompting, leading to inconsistent results and wasted time.

## Solution
A persistent AI agent that:
- understands context
- executes structured writing tasks
- charges per execution
- logs proof on-chain

## Target Users
- writers
- students
- content creators

## Key Features
- one-click writing execution
- structured output (not raw text dump)
- continuity-aware generation
- payment-triggered execution
- on-chain verification

---

## Day-by-Day Plan

### Day 1
- Create React app (Vite)
- Build UI: textarea, "Run Agent" button, output box

### Day 2
- Backend (Node/Express)
- Endpoint: /run-agent
- Connect UI → backend

### Day 3
- Integrate local model (GGUF writer)
- Basic flow: input → model → output

### Day 4
- Add "agent logic": clean prompt structure, 2-step flow (improve + refine)
- Add fake or real payment trigger

### Day 5
- Integrate Kite: log transaction, store proof
- Deploy (Vercel + backend)

---

## Demo Script

1. Paste messy text
2. Click "Run Agent"
3. Show output
4. Show transaction ID and proof on-chain

Say: "The agent executed a paid task and recorded it on-chain."

---

## Architecture

```
User Input
    ↓
Clean Prompt Wrapper
    ↓
Phase 2 (Expand only - simplified)
    ↓
Output
    ↓
Payment Trigger
    ↓
Kite Logging
```

---

## What to Use from Current System

### Keep (Black Box):
- Phase 2 pipeline (outline → expand)
- context builder
- basic generation flow

### Ignore:
- validator complexity
- state migration issues
- JSON vs SQLite conflict
- story-specific garbage

---

## What NOT to Do

- Don't mention "72 chapters" or "emotional tensor state tracking"
- Don't show CLI
- Don't over-explain architecture

---

## Strategic Move

Ship simple version, talk about advanced system in demo:

"This is a simplified interface over a deeper narrative engine capable of maintaining long-term story state."

---

## Bugs to Fix (Critical)

1. expander.py:872 None check bug (WILL break demo)
2. Basic error handling

---

## Final Decision

Build a thin, clean, demo-friendly agent that uses the messy narrative engine as a backend.

Clean UI. Chaotic backend. Silent prayers in between.