export const maxDuration = 30;

export async function POST(req: Request) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3010';
  const headers = new Headers({ 'content-type': 'application/json' });
  const authorization = req.headers.get('authorization');
  const internalToken = process.env.AI_SERVICE_INTERNAL_TOKEN;

  if (authorization) headers.set('authorization', authorization);
  if (internalToken) headers.set('x-ai-service-token', internalToken);

  const response = await fetch(`${aiServiceUrl}/chat`, {
    method: 'POST',
    headers,
    body: await req.text(),
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
