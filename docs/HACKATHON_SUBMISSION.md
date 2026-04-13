# InkAgent for Kite AI Global Hackathon 2026

## Project

**InkAgent – Autonomous Writing Agent**

InkAgent is an autonomous AI writing agent that improves and continues long-form content with persistent workflow awareness. The system analyzes user input, generates writing output, executes a paid action, and returns verifiable proof of execution in one end-to-end flow.

## Hackathon Fit

InkAgent is designed to align with the Kite AI Global Hackathon 2026 focus:

- autonomous AI agent behavior
- paid execution flow
- proof and auditability
- live, reproducible demo
- functional UI

For the current hackathon build, payment and proof are implemented as production-style simulation layers. The architectural intent is to connect those layers to Kite chain settlement and attestations.

## One-Line Pitch

InkAgent is an autonomous writing agent that executes paid writing tasks and returns verifiable proof of execution through a simple web interface.

## Problem

Most AI writing tools are:

- stateless
- prompt-heavy
- manual
- disconnected from execution and payment

Users still have to think like operators instead of simply asking the system to complete work.

## Solution

InkAgent turns writing into an agent workflow:

1. user submits text
2. agent chooses an execution path
3. agent performs the writing task
4. payment is executed
5. proof is logged and returned

That changes the interaction from “prompt a model” to “delegate a task.”

## Current Build

### User Experience

- paste text
- choose `Improve` or `Continue`
- select a local profile if needed
- click once
- receive output, payment confirmation, and proof

### Runtime Strategy

The current hackathon build defaults to `Demo Mode`:

- local-first execution for reliability
- visible provider status
- explicit fallback behavior
- specialist model download awareness

This makes the demo resilient under free-tier API instability while preserving the future scaling path to API-backed higher-quality runs.

### Surfaces

- `Web App`: primary product and judge-facing demo surface
- `CLI`: operator surface for smoke tests, local runs, and model download control

## Why This Fits Kite

Kite’s framing is about autonomous agents that transact, settle, and prove what they did.

InkAgent maps onto that model cleanly:

- the agent performs a real task: writing improvement or continuation
- the task has a payment event attached
- the system emits proof metadata
- the workflow is end-to-end and UI-accessible

## How It Meets the Requirements

### Shows an AI agent that performs a task and settles on Kite chain

Current state:

- agent performs the task
- settlement is simulated in the current build

Next integration step:

- replace simulated payment with Kite-backed settlement

### Executes paid actions

Current state:

- every run creates a payment object and transaction record

### Works end-to-end in a live demo in production

Current state:

- web app and CLI flow are reproducible
- local-first demo mode reduces provider failure risk

### Uses Kite chain for attestations

Current state:

- proof structure exists: input hash, output hash, timestamp, transaction metadata

Next integration step:

- anchor proof data to Kite attestation flow

### Functional UI required

Current state:

- React + Vite web app
- repo-local CLI

### Demo must be publicly accessible or reproducible via README

Current state:

- reproducible by README and CLI instructions

## Judging Criteria Mapping

### Agent Autonomy

InkAgent minimizes human involvement after input:

- input submitted once
- routing decided internally
- execution completed end to end
- payment and proof returned automatically

### Developer Experience

InkAgent includes:

- web app
- CLI
- architecture docs
- API docs
- demo guide
- download tooling for local specialist model

### Real-World Applicability

Writing and editing are concrete, high-frequency tasks for:

- writers
- students
- creators
- solo teams

### Novelty / Creativity

InkAgent combines:

- autonomous writing execution
- payment-linked task completion
- proof generation
- resilient local-first hackathon architecture

## Demo Narrative

The strongest demo framing is:

> InkAgent is an autonomous writing agent. It takes text, executes the writing task, attaches a paid action, and returns verifiable proof of execution.

Then show:

1. input
2. agent steps
3. output
4. payment
5. proof

## Current Constraints

- free-tier APIs are rate-limited
- specialist local model is still downloading
- Kite settlement is not yet wired into the live transaction path

These are known constraints, not hidden failures.

## Next Integration Priorities

1. replace simulated settlement with Kite transaction flow
2. connect proof layer to Kite attestation path
3. finish specialist writer GGUF provisioning
4. keep local-first demo mode as the reliability baseline

## Short Submission Description

InkAgent is an autonomous writing agent that improves and continues text, executes a paid action per run, and returns verifiable proof of execution. It is built as a local-first, resilient agent system with a simple web interface and operator CLI, designed to scale into Kite-backed settlement and attestation flows.
