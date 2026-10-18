import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const svixId = req.headers.get('svix-id') || req.headers.get('webhook-id');
    const svixTimestamp =
      req.headers.get('svix-timestamp') || req.headers.get('webhook-timestamp');
    const svixSignature =
      req.headers.get('svix-signature') || req.headers.get('webhook-signature');

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace('/trpc', '') ||
      'https://anmol-vastralay.onrender.com';

    const response = await fetch(`${backendUrl}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(svixId ? { 'svix-id': svixId } : {}),
        ...(svixTimestamp ? { 'svix-timestamp': svixTimestamp } : {}),
        ...(svixSignature ? { 'svix-signature': svixSignature } : {}),
      },
      body: rawBody,
    });

    const data = await response.json().catch(() => ({ received: true }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Webhook proxy error' },
      { status: 500 },
    );
  }
}
