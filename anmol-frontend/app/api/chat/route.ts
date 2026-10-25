export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    // Call unified backend ChatbotService
    const backendRes = await fetch(`${backendUrl}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.get('authorization') || '',
      },
      body: JSON.stringify({ messages }),
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      const reply = data.reply || 'Namaste! How may I assist you today?';
      
      // Stream response in Vercel AI SDK compatible format
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`0:${JSON.stringify(reply)}\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1',
        },
      });
    }

    // Fallback if backend /chat/message returns non-200
    const fallbackReply = 'Namaste! Welcome to Anmol Vastralay. You can browse our luxury sarees and ethnic wear or track your active orders.';
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(fallbackReply)}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

