# InkAgent API

## Overview

InkAgent exposes a small API surface designed around one core interaction: run the autonomous writing agent and return output, payment state, and proof.

Base local backend URL:

```text
http://localhost:3001
```

## `POST /run-agent`

Runs the writing agent on user input.

### Request Body

```json
{
  "text": "input text",
  "mode": "improve",
  "localProfile": "normal"
}
```

### Fields

- `text`: required user input
- `mode`: writing mode, typically `improve` or `continue`
- `localProfile`: optional local execution profile, `normal` or `specialist`

### Success Response

```json
{
  "success": true,
  "output": "Improved or continued text",
  "model": "local-mistral",
  "degraded": true,
  "mode": "improve",
  "demoMode": true,
  "executionMode": "demo-local",
  "localProfile": "normal",
  "fallbackUsed": true,
  "warnings": [
    "Demo Mode active: running on local normal model"
  ],
  "scalingNote": "Demo Mode uses local models for reliability. At scale, the system will opportunistically use API-based inference for stronger output quality.",
  "steps": [
    { "id": 1, "text": "Analyzing input...", "status": "completed" }
  ],
  "transaction": {
    "id": "0xabc123",
    "cost": "$0.01",
    "timestamp": "2026-04-08T00:00:00.000Z",
    "status": "settled"
  },
  "proof": {
    "inputHash": "abc123...",
    "outputHash": "def456...",
    "algorithm": "SHA-256"
  }
}
```

### Failure Response

```json
{
  "success": false,
  "error": "No text provided"
}
```

### Notes

- The backend uses model routing with fallback
- In `Demo Mode`, the backend prefers local execution first
- payment is simulated for hackathon scope
- proof is generated from input and output hashes
- the response always aims to preserve end-to-end completion

## `GET /transactions`

Returns recent transaction history from the in-memory execution log.

### Example Response

```json
[
  {
    "txId": "0xabc123",
    "inputHash": "abc123...",
    "outputHash": "def456...",
    "timestamp": "2026-04-08T00:00:00.000Z",
    "model": "local-mistral",
    "mode": "improve",
    "degraded": true,
    "inputLength": 120,
    "outputLength": 240,
    "cost": 0.005
  }
]
```

## `GET /health`

Returns backend health and configured model stack information.

### Example Response

```json
{
  "status": "ok",
  "demoMode": true,
  "scalingNote": "Demo Mode uses local models for reliability. At scale, the system will opportunistically use API-based inference for stronger output quality.",
  "models": {
    "primary": "gemini-2.0-flash",
    "secondary": "google/gemma-3-27b-it:free",
    "tertiary": "nousresearch/hermes-3-llama-3.1-405b:free",
    "fallback": "local-mistral",
    "localProfiles": []
  },
  "providerChecks": {
    "gemini": { "configured": true, "reachable": false },
    "openrouter": { "configured": true, "reachable": false },
    "localFallback": { "configured": true, "reachable": true }
  }
}
```

Tip:

- `GET /health?check=providers` probes live provider reachability

## `GET /config`

Returns the current runtime surface configuration for the frontend and CLI.

### Example Response

```json
{
  "demoMode": true,
  "scalingNote": "Demo Mode uses local models for reliability. At scale, the system will opportunistically use API-based inference for stronger output quality.",
  "localProfiles": [
    {
      "key": "normal",
      "label": "Normal Local",
      "downloadReady": true
    },
    {
      "key": "specialist",
      "label": "Specialized Writer",
      "requestedSize": 2442530816,
      "minimumBytes": 5000000000,
      "downloadPercent": 48.9,
      "downloadReady": false
    }
  ]
}
```

## `GET /models`

Returns model routing information and per-model cost mapping.

### Example Response

```json
{
  "primary": "gemini-2.0-flash",
  "secondary": "google/gemma-3-27b-it:free",
  "tertiary": "nousresearch/hermes-3-llama-3.1-405b:free",
  "fallback": "local-mistral",
  "demoMode": true,
  "localProfiles": [],
  "costs": {
    "gemini-2.0-flash": 0.02,
    "gemma-3-27b": 0.02,
    "hermes-3-405b": 0.05,
    "local-mistral": 0.005,
    "demo-fallback": 0.001
  }
}
```

## Execution Semantics

InkAgent is designed around this contract:

1. accept input
2. generate output
3. associate payment
4. generate proof
5. return a complete response

That contract matters more than whether the winning model is primary or fallback in any given run.

In the current hackathon configuration:

- the web app is the primary user surface
- the CLI is the operator surface
- demo execution is local-first
- cloud APIs are positioned as scaling upgrades, not demo dependencies

## Environment Variables

Expected backend environment variables:

```env
GEMINI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
INKAGENT_DEMO_MODE=true
```

## CLI Surface

InkAgent also exposes a repo-local CLI:

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

Optional global install:

```bash
npm link
inkagent --help
```

## cURL Example

```bash
curl -X POST http://localhost:3001/run-agent \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The paragraph feels flat and repetitive. Improve it.",
    "mode": "improve",
    "localProfile": "normal"
  }'
```
