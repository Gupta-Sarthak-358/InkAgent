# InkAgent Demo Guide

## Demo Goal

Show that InkAgent autonomously completes a writing task, simulates payment, and returns verifiable proof in one clean flow.

The demo should feel simple, fast, and inevitable.

For hackathon positioning, this demo should clearly map to:

- autonomous agent behavior
- paid execution
- proof / auditability
- reproducible end-to-end workflow

## Demo Setup

Before presenting:

1. start the backend
2. start the frontend
3. confirm `/health` is returning `ok`
4. have a prepared input sample ready

## Recommended Demo Flow

1. Paste text into the input box.
2. Choose a mode if needed.
3. Click the run button.
4. Let the execution steps play on screen.
5. Show the generated output.
6. Point to the transaction record.
7. Point to the proof hashes.

## What to Say

Open with:

> InkAgent is an autonomous writing agent. It takes text, executes the writing task, attaches a paid action, and logs verifiable proof of execution.

While the run is happening:

> The agent is analyzing the request, selecting the best available model, and completing the task end to end.

When results appear:

> The output is complete, the transaction is settled, and the proof hashes verify what was processed.

Closing line:

> The agent autonomously executed a paid writing task and logged verifiable proof.

Then stop.

## What to Emphasize

- one-click execution
- model routing
- resilience through fallback
- payment simulation
- proof generation
- clear path to Kite settlement and attestation

## What Not to Emphasize

- backend messiness
- implementation scars
- internal retries unless asked
- unnecessary prompt details

Do not frame the product as a chatbot. Frame it as an agent workflow.

## Best Input Examples

### Improve Mode

Use text that is clearly rough but salvageable:

> The city felt sad. Mara walked through the market and thought about everything that had gone wrong. She looked at the empty stalls and felt bad.

This makes the improvement obvious and satisfying.

### Continue Mode

Use text with a natural narrative handoff:

> The letter was still warm when Elias unfolded it. He read the first line twice, then looked toward the staircase as the house fell silent.

This makes continuation feel agentic rather than mechanical.

## Judge-Friendly Framing

If asked what makes this different from normal AI tools:

- it is not prompt-first
- it is execution-first
- it links generation to payment and proof
- it is built to complete the whole workflow, not just return text

If asked how it fits Kite specifically:

- the agent performs a real task
- the task has a payment event attached
- proof metadata is generated for attestation
- the current build is architected to connect those records to Kite chain

## Failure Handling During Demo

If a provider fails:

- do not panic
- let the fallback chain do its job
- describe it as resilience, not error

Recommended line:

> InkAgent is designed to degrade gracefully, so the user still gets a finished result even if an upstream model fails.

## Final Positioning

InkAgent does not need to claim perfect autonomy.

It only needs to convincingly demonstrate:

- autonomous execution
- paid action linkage
- verifiable proof
- reliable end-to-end completion

That is the hackathon story.
