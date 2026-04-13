# InkAgent Frontend

React + Vite frontend for the InkAgent hackathon demo.

## Local Development

```bash
npm install
npm run dev
```

By default, Vite proxies API requests to `http://localhost:3001`, so the frontend can call:

- `/run-agent`
- `/health`
- `/models`
- `/transactions`

without hardcoding a backend origin in the UI.

## Optional Environment Override

If you want the frontend to target a different backend origin, set:

```env
VITE_API_BASE_URL=http://localhost:3001
```

When unset, the app uses relative API paths and relies on the Vite dev proxy.

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```
