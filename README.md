# InkAgent

InkAgent is an autonomous writing agent for hackathon demos. A user pastes text, clicks once, and the system handles routing, generation, payment simulation, and proof logging in one flow.

The goal is not to expose prompt engineering or tool juggling. The goal is to deliver a finished result with visible execution steps, a transaction record, and verifiable proof of execution.

For the Kite AI Global Hackathon 2026 framing, see [docs/HACKATHON_SUBMISSION.md](/home/satvi/RAG_PHASE_1/inkagent_hackathon/docs/HACKATHON_SUBMISSION.md).

## Demo Mode

InkAgent now defaults to `Demo Mode`, which makes the app local-first for reliability:

- `Normal Local`: Mistral 7B for fast, dependable runs
- `Specialized Writer`: writer-focused local profile backed by the local models directory

In Demo Mode, the UI explicitly tells the user that:

- we are using local execution for reliability now
- when scaling, we will opportunistically route into API-based models for higher-quality output

This makes the demo feel intentional instead of looking like a silent fallback.

## Product Surfaces

InkAgent now has two operating surfaces:

- `Web App`: the primary product and demo experience
- `CLI`: the operator and developer surface for smoke tests, downloads, and local runs

This split is deliberate:

- judges and users should experience the web app
- developers should keep a CLI for diagnostics and control

### CLI Commands

From the repo root:

```bash
./inkagent --help
./inkagent models
./inkagent smoke
./inkagent download-specialist
./inkagent run --mode improve --profile normal --text "Tighten this paragraph."
```

Equivalent Node form:

```bash
node ./cli/inkagent.js --help
node ./cli/inkagent.js models
node ./cli/inkagent.js smoke
node ./cli/inkagent.js download-specialist
node ./cli/inkagent.js run --mode improve --profile normal --text "Tighten this paragraph."
```

Or through npm:

```bash
npm run cli:help
npm run cli:models
npm run cli:smoke
npm run cli:download-specialist
```

## Product Vision

Current AI writing tools are powerful, but they are still mostly:

- stateless
- prompt-heavy
- manual
- disconnected from execution and payment

InkAgent reframes that experience as an agent workflow:

1. user submits text
2. agent analyzes the task
3. agent selects the best available model
4. generation completes
5. a paid action is simulated
6. proof is recorded and returned

The result is a coherent, resilient, demonstrable system built for hackathon judging.

## Core Value Proposition

Users do not:

- craft prompts
- manually retry different models
- manage generation tools
- wonder whether the task actually executed

Users do:

- paste
- click
- receive output, payment confirmation, and proof

## System Architecture

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

### Frontend

React + Vite UI responsible for:

- capturing input
- triggering a single run action
- showing execution steps
- showing Demo Mode state
- showing provider status
- showing specialist model download progress
- displaying output
- visualizing payment and proof

### Backend

Node.js + Express service responsible for:

- routing requests
- validating input
- exposing runtime config to the frontend
- calling model providers
- handling retries and fallback
- generating payment records
- generating proof hashes

### CLI

Repo-local operator surface responsible for:

- smoke testing providers
- inspecting local model status
- resuming specialist model download
- running local generation directly

### Model Layer

Long-term scaling path:

1. Gemini Flash
2. OpenRouter Gemma 27B
3. OpenRouter Hermes 405B
4. Local models

Current hackathon runtime:

1. `Normal Local` using Mistral 7B
2. `Specialized Writer` using the writer-tuned local profile when ready
3. fallback local model if the specialist GGUF is still downloading
4. API-based routing later when scaling out of Demo Mode

### Payment Layer

Hackathon-scope payment is simulated with:

- fixed cost per execution
- generated transaction ID
- settled payment status
- timestamped transaction record

### Proof Layer

Each successful run returns:

- input hash
- output hash
- timestamped transaction metadata

This provides verifiable proof that a paid execution occurred.

## Design Principles

### 1. Reliability > Intelligence

The system should never collapse during demo flow. If one provider fails, the next one should carry the request.

### 2. Perceived Autonomy > Actual Complexity

The product should feel like an agent, not a raw API call. Execution steps, routing, payment, and proof all reinforce that experience.

### 3. Graceful Degradation

Failures should produce fallback behavior, not dead ends. The system must recover through retries, alternate models, and local execution.

### 4. End-to-End Completion

Every request should result in:

- output
- payment state
- proof

## API Overview

### `POST /run-agent`

Runs the writing agent.

Request:

```json
{
  "text": "input text",
  "mode": "improve",
  "localProfile": "normal"
}
```

Response shape:

```json
{
  "success": true,
  "output": "...",
  "model": "local-mistral",
  "demoMode": true,
  "executionMode": "demo-local",
  "localProfile": "normal",
  "warnings": [
    "Demo Mode active: running on local normal model"
  ],
  "transaction": {
    "id": "0xabc123",
    "cost": "$0.01",
    "timestamp": "2026-04-08T00:00:00.000Z"
  },
  "proof": {
    "inputHash": "...",
    "outputHash": "..."
  }
}
```

### `GET /transactions`

Returns recent execution history.

### `GET /health`

Returns service and model stack health information.

For full details, see [docs/API.md](/home/satvi/RAG_PHASE_1/inkagent_hackathon/docs/API.md).

## Quick Start

### Repo CLI

```bash
./inkagent --help
```

Optional global shell install:

```bash
npm link
inkagent --help
```

### Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

Create or update your environment file with:

```env
GEMINI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
INKAGENT_DEMO_MODE=true
```

## Specialist Model Download

The specialist local writer profile uses a writer-tuned GGUF model. Place it in the `models/` directory.

Download from HuggingFace and save to `./models/Gemma-The-Writer-N-Restless-Quill-10B-D_AU-IQ4_XS.gguf`

Resume the download from an external terminal with:

```bash
cd inkagent_hackathon
bash scripts/download_specialist_model.sh
```

Or:

```bash
cd backend
npm run download:specialist
```

Until that file is complete, the `Specialized Writer` profile automatically falls back to another available local model.

## Demo Story

The best demo flow is:

1. paste text
2. click run
3. show execution steps
4. show improved output
5. show payment
6. show proof

Key line:

> The agent autonomously executed a paid writing task and logged verifiable proof.

Then stop talking.

For the fuller presentation flow, see [docs/DEMO.md](/home/satvi/RAG_PHASE_1/inkagent_hackathon/docs/DEMO.md).

## Constraints

- API providers may rate limit
- fallback models may be slower or lower quality
- local generation may be CPU-bound

Mitigation is built around retries, fallback routing, and clear UI feedback.

## Future Scope

Short-term:

- integrate real Kite settlement
- improve output quality
- add lightweight memory

Long-term:

- multi-agent writing workflows
- subscription billing
- writer-specific personalization

## Documentation

- [docs/ARCHITECTURE.md](/home/satvi/RAG_PHASE_1/inkagent_hackathon/docs/ARCHITECTURE.md)
- [docs/API.md](/home/satvi/RAG_PHASE_1/inkagent_hackathon/docs/API.md)
- [docs/DEMO.md](/home/satvi/RAG_PHASE_1/inkagent_hackathon/docs/DEMO.md)
- [ideas/PLAN.md](/home/satvi/RAG_PHASE_1/inkagent_hackathon/ideas/PLAN.md)
