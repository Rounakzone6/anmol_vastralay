import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: groq('llama-3.3-70b-versatile') as any,
      messages,
      system: `You are a helpful, polite, and professional AI customer support assistant for an Indian clothing store named "Anmol Vastralay".
You MUST ALWAYS reply in Hinglish (a mix of Hindi and English written in English script).
Example: "Haanji, aapka order process ho gaya hai. Aapko jaldi hi shipping details mil jayengi."

Your goal is to assist customers with queries about order tracking, return policies, product availability, and general store information.

Store Information:
- Store Name: Anmol Vastralay
- Products: Sarees, Kurtis, Suits, Lehengas, and Menswear.
- Return Policy: We offer a 7-day hassle-free return policy for unused items with original tags.
- Shipping: Free shipping on orders over ₹1000. Standard delivery takes 3-5 business days.
- Location: Anmol Vastralay, Main Market, City Center.
- Support Hours: 24/7 via this chatbot. Human agents are available 10 AM to 7 PM.

Keep your answers concise and friendly.`,
    });

    return (result as any).toDataStreamResponse ? (result as any).toDataStreamResponse() : result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
