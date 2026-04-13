# InkAgent Architecture

## Purpose

InkAgent is an autonomous writing agent that accepts text input, completes a writing task, simulates a paid action, and returns proof of execution.

The system is designed for hackathon reliability first. It should feel autonomous, recover gracefully, and always complete the flow with a tangible result.

## High-Level Flow

```text
Web App / CLI
   ↓
Agent Router
   ↓
Demo Mode Policy
   ↓
Local Profile Selection or API Routing
   ↓
Generation
   ↓
Payment Simulation
   ↓
Proof Generation
   ↓
Response
```

## Core Components

### Product Surfaces

InkAgent now has two surfaces:

- `Web App`: the primary user and judge-facing experience
- `CLI`: the operator and developer experience for smoke tests, downloads, and direct local runs

This is intentional. The web app is the product. The CLI is the control plane.

### Frontend

The frontend is a React + Vite application responsible for:

- collecting text input
- exposing a one-click execution flow
- showing execution steps
- showing Demo Mode state
- showing provider status
- showing specialist model download progress
- presenting model choice, output, payment, and proof

### Backend

The backend is a Node.js + Express service responsible for:

- accepting requests
- validating payloads
- exposing runtime config for the frontend
- routing to the best available model
- retrying failed providers
- falling back when needed
- creating transaction metadata
- creating proof hashes

### CLI

The CLI provides a repo-local command surface for:

- provider smoke tests
- specialist model downloads
- local model inspection
- direct local text generation

Example commands:

```bash
./inkagent smoke
./inkagent models
./inkagent download-specialist
./inkagent run --mode improve --profile normal --text "Tighten this paragraph."
```

Equivalent Node form:

```bash
node ./cli/inkagent.js smoke
node ./cli/inkagent.js models
node ./cli/inkagent.js download-specialist
node ./cli/inkagent.js run --mode improve --profile normal --text "Tighten this paragraph."
```

### Model Selection Layer

The long-term routing priority remains:

1. Gemini Flash
2. OpenRouter Gemma 27B
3. OpenRouter Hermes 405B
4. Local Mistral

But the current hackathon runtime defaults to `Demo Mode`, which changes the effective policy:

1. local `normal` profile
2. local `specialist` profile when selected
3. fallback local model if the specialist download is incomplete
4. API routing later when scaling out of demo mode

This supports the product philosophy:

- reliability over perfect quality
- visible autonomy over hidden complexity
- no dead-end failures during demo

### Local Model Profiles

InkAgent uses local GGUF models for demo reliability:

- `Normal Local`: Mistral 7B
- `Specialized Writer`: Gemma writer-tuned GGUF

The system automatically detects available models in the `models/` directory and uses fallback models if the requested model is not available.

## Execution Pipeline

Each run follows the same conceptual sequence:

1. Analyze input
2. Select local profile or model route
3. Generate output
4. Process payment
5. Log proof

The UI mirrors this with lightweight step simulation such as:

- Analyzing input...
- Selecting local execution profile...
- Enhancing narrative...
- Finalizing output...

This is important because the product experience should feel like an agent making progress, not a black-box text completion call.

## Payment Layer

The current payment layer is intentionally simple:

- fixed cost per execution
- generated transaction ID
- settled status
- execution timestamp

Example shape:

```json
{
  "id": "0xabc123",
  "cost": "$0.02",
  "timestamp": "2026-04-08T00:00:00.000Z",
  "status": "settled"
}
```

The purpose is not financial precision. The purpose is to prove that agent execution is linked to a paid action.

## Proof Layer

For every completed run, InkAgent records:

- input hash
- output hash
- timestamp via transaction metadata

This serves three goals:

1. verifiability
2. hackathon alignment
3. future compatibility with on-chain logging

## Reliability Strategy

### Retry Behavior

External providers should be retried up to two times before the system moves to the next fallback layer.

### Graceful Degradation

If premium providers fail, the system still completes using:

- backup remote models
- local model execution
- final demo-safe fallback if necessary

If the specialist local model is still downloading, the system:

- reports download progress in the UI
- marks the specialist profile as not fully ready
- uses a fallback local model until the download completes

### Demo Safety

The system should never leave the user with a blank result or a crashed workflow. The UX promise is completion.

## Constraints and Risks

### API Rate Limits

- Gemini may hit request limits
- OpenRouter free tiers may be constrained

### Latency

- larger fallback models can be slow
- local generation can be CPU-bound

### Quality Variance

- fallback output quality may vary across providers

Mitigations:

- retry logic
- fallback cascade
- visible status updates in the UI
- CLI-based smoke tests and download control

## Future Architecture Direction

Short-term improvements:

- real Kite chain integration
- stronger output consistency
- lightweight memory layer
- clean transition from demo-local mode to API-enhanced production mode

Long-term evolution:

- multi-agent orchestration
- usage-based billing
- writer personalization

## System Philosophy Summary

InkAgent does not need to be the smartest writing system in the room.

It needs to be:

- coherent
- resilient
- complete
- easy to demo

That is exactly the right architecture target for a hackathon agent product.
