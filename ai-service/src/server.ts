import http from 'node:http';
import { config } from './config.js';
import { createChatResponse } from './assistant.js';

function writeJson(res: http.ServerResponse, status: number, body: object) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      return writeJson(res, 200, {
        service: 'anmol-ai-service',
        status: 'ok',
        endpoints: {
          health: 'GET /health',
          chat: 'POST /chat',
        },
      });
    }
    if (req.method === 'GET' && req.url === '/health') {
      return writeJson(res, 200, { status: 'ok', service: 'ai-service' });
    }
    if (req.method !== 'POST' || req.url !== '/chat') {
      return writeJson(res, 404, { error: 'Not found' });
    }

    const internalToken = config.internalToken;
    if (internalToken && req.headers['x-ai-service-token'] !== internalToken) {
      return writeJson(res, 401, { error: 'Unauthorized' });
    }

    const body = (await readJson(req)) as { messages?: unknown };
    const userToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const response = await createChatResponse(body.messages, userToken);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (!response.body) return res.end();

    const reader = response.body.getReader();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      res.write(Buffer.from(chunk.value));
    }
    res.end();
  } catch (error) {
    console.error('AI service request failed:', error);
    if (!res.headersSent) writeJson(res, 400, { error: 'Invalid AI request' });
    else res.end();
  }
});

server.listen(config.port, () => {
  console.log(`AI service listening on http://localhost:${config.port}`);
});
