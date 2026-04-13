# InkAgent Improvement Plan

This document separates:

- what would be ideal
- what is realistic before submission
- what should explicitly wait until after the hackathon

## Current State

InkAgent currently has:

- a working web app
- a repo-local CLI
- demo-local execution mode
- two local profiles: `normal` and `specialist`
- simulated payment
- proof generation
- provider diagnostics
- specialist model download tracking

This is already enough to present a coherent agent system.

## The Most Important Truth

The current bottleneck is not “lack of ideas.”

The bottleneck is:

- time
- provider instability
- incomplete Kite integration

So the improvement plan must optimize for:

- submission safety
- demo reliability
- visible alignment with Kite requirements

## Priority 1: Must-Do Before Submission

These are the highest-value changes still worth doing.

### 1. Wire a Real Kite-Tinted Transaction Path

If full chain settlement is too much, at minimum:

- add a clear transaction adapter layer
- shape the transaction object like a future Kite settlement record
- make the code path obvious and demoable

Best realistic outcome:

- one small backend module dedicated to payment / attestation integration

Why:

- this improves hackathon alignment more than almost any cosmetic feature

### 2. Add a Real Attestation Adapter Layer

Current proof is already useful:

- input hash
- output hash
- timestamp

Improve it by:

- extracting proof creation into a dedicated module
- naming it explicitly as attestation-ready
- documenting the future Kite handoff point

Why:

- judges care about proof and auditability

### 3. Finish Specialist Model Provisioning

Complete the download and confirm the specialist profile switches from fallback to the intended writer GGUF.

Why:

- this strengthens the “specialized agent” story
- it makes the local-first demo more impressive

### 4. Tighten Demo Copy in the UI

The UI should say:

- Demo Mode
- local-first for reliability
- API-enhanced when scaling
- paid execution
- proof generated

Why:

- judges read screens faster than READMEs

### 5. Add a Deployment Checklist

Create a short deploy guide that covers:

- frontend hosting
- backend hosting
- env vars
- how to reproduce the demo

Why:

- reproducibility is part of judging

## Priority 2: Good If Time Allows

These are valuable, but not worth endangering the base submission.

### 1. Better Structured Output

Instead of raw text only, add optional structured sections such as:

- revised text
- style notes
- tone notes

Why:

- makes the output look more agentic

### 2. Profile-Specific Prompting Improvements

Improve the distinction between:

- `normal` local profile
- `specialist` writer profile

Why:

- gives a more obvious reason for the second mode to exist

### 3. Better Transaction History View

Surface recent runs more cleanly in the UI.

Why:

- helps sell the “agent economy” angle

### 4. Lightweight Video / Submission Assets

Prepare:

- 30-second demo flow
- 2-minute judge walkthrough
- submission screenshots

Why:

- this often matters more than another feature

## Priority 3: Explicitly Do Not Do Now

These ideas are tempting, but wrong for the current time horizon.

### 1. Deep Reuse of the Parent Narrative Engine

Do not try to fully integrate:

- Phase 2 planning
- story canon context
- style RAG
- voice memory
- full narrative workflows

Why:

- too much coupling
- too much risk
- not needed to satisfy hackathon judging

### 2. Multi-Agent Expansion

Do not build:

- agent swarms
- planner/worker graphs
- orchestration dashboards

Why:

- difficult to stabilize
- hard to explain quickly
- low demo payoff

### 3. Fancy Blockchain Scope Creep

Do not attempt:

- cross-chain complexity
- full DeFi integration
- advanced governance

unless the submission is already stable.

Why:

- the base story is already strong enough

## What Can Actually Be Done Instead

When a larger idea is too risky, use these substitutions.

### Instead of Full Kite Settlement

Do:

- payment adapter module
- transaction payload that looks chain-ready
- clear hook point for Kite integration

### Instead of Full On-Chain Attestations

Do:

- dedicated proof module
- deterministic hashes
- documented attestation handoff point

### Instead of Deep Parent-Repo Integration

Do:

- keep reusing parent models and venv
- borrow prompt ideas only if needed
- keep the hackathon app lightweight and isolated

### Instead of Chasing Better Free APIs

Do:

- rely on local-first execution
- keep provider diagnostics visible
- position APIs as scaling upgrades

## Recommended Remaining Workflow

1. finish specialist model download
2. add payment / attestation adapter modules
3. polish demo copy and transaction/proof presentation
4. finalize deployment and README reproducibility
5. record the demo

## Final Recommendation

The winning version of InkAgent is not the most complicated one.

It is the version that clearly demonstrates:

- autonomous task completion
- paid execution
- proof generation
- reliable demo behavior
- a believable path to Kite integration

That is the standard to optimize for now.
