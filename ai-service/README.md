# Anmol AI Service

Standalone Gemini and RAG service for the Anmol Vastralay storefront.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

The service listens on `http://localhost:3010`.

- `GET /health` checks service availability.
- `POST /chat` accepts the AI SDK UI message payload.

The service keeps the Gemini API key server-side and calls the backend tRPC API for live product and authenticated order data. The frontend should call its own `/api/chat` proxy rather than exposing this service publicly.

## Environment

Set `GEMINI_API_KEY`, `BACKEND_API_URL`, and `AI_SERVICE_INTERNAL_TOKEN` in deployment. The same internal token must be configured in the frontend proxy and AI service.
