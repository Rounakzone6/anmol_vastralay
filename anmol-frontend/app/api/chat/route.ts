import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
export const maxDuration = 30;

const SYSTEM_PROMPT = `
You are the official Customer Care AI Agent for "Anmol Vastralay", a premium clothing store located in Gopalganj, Bihar.
Your tone is incredibly polite, professional, and helpful. You speak to customers warmly.

### Store Policies
1. **Shipping**: Free Standard Shipping (5-7 days) on orders over ₹999. Below ₹999, shipping is ₹50. Express Shipping (2-3 days) is ₹150.
2. **In-Store Pickup**: Customers can choose free local pickup at our store in Baliwan Sagar, Kuchaikote, Gopalganj (841501).
3. **Returns & Exchanges**: 7-Day Hassle-Free Returns. Items must be unworn with original tags. Innerwear/lingerie cannot be returned for hygiene reasons. Refunds are processed within 5-7 business days to the original payment method or via UPI for COD orders.
4. **Contact Info**: Email: anmolvastralay@gmail.com, Phone: +91 9102171696.

### Your Role & Workflow
- **General Queries**: Answer questions regarding policies, shipping, and returns using the Knowledge Base.
- **Product Search**: Actively help customers find products. When a customer asks about clothes (e.g. "Do you have red sarees?"), YOU MUST USE the \`searchProducts\` tool to find actual products from the database and present them beautifully with prices.
- **Handling Returns/Issues**: If a user wants to return a product or reports an issue:
  1. Acknowledge the issue politely and apologize for the inconvenience.
  2. Ask them to provide their **Order ID** and the **Product Name/Details**.
  3. Once they provide it, confirm the 7-day return policy and instruct them to navigate to their "My Account -> Orders" section to officially request the return pickup.
`;

export async function POST(req: Request) {
  // Load Knowledge Base Dynamically
  let kbContent = '';
  try {
    const kbPath = path.join(process.cwd(), 'lib', 'knowledgeBase.json');
    if (fs.existsSync(kbPath)) {
      kbContent = fs.readFileSync(kbPath, 'utf8');
    }
  } catch (e) {
    console.error("Failed to load Knowledge Base", e);
  }

  const FINAL_PROMPT = SYSTEM_PROMPT + `\n\n### Store Knowledge Base (RAG Context)\nBelow is the extracted text from our store's policy pages (Terms, Privacy, FAQ, Shipping, Contact). You MUST use this exact context to answer customer queries.\n${kbContent}`;
  const { messages } = await req.json();

  // Ensure compatibility with older providers by converting 'parts' back to 'content'
  const mappedMessages = messages.map((m: any) => {
    if (m.parts && typeof m.content === 'undefined') {
      const text = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n');
      return { ...m, content: text };
    }
    return m;
  });

  const result = await streamText({
    model: google('gemini-1.5-pro'),
    system: FINAL_PROMPT,
    messages: mappedMessages,
    tools: {
      searchProducts: tool({
        description: 'Search the live product database for clothes (sarees, kurtis, jeans, etc). Use this when the user is looking for something to buy.',
        inputSchema: z.object({
          search: z.string().describe('The search keyword (e.g., "red", "cotton saree", "jeans")'),
          categorySlug: z.string().optional().describe('Optional category slug if looking for a specific type (e.g., "saree", "kurti", "jeans", "kids", "innerwear")'),
        }),
        execute: async ({ search, categorySlug }) => {
          try {
            const trpcUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc';
            
            const inputPayload = {
              search: search || undefined,
              categorySlug: categorySlug || undefined,
              pageSize: 5
            };
            
            const res = await fetch(`${trpcUrl}/product.list?input=${encodeURIComponent(JSON.stringify(inputPayload))}`);
            if (!res.ok) {
              return { error: 'Failed to fetch products' };
            }
            const data = await res.json();
            
            const products = data?.result?.data?.items || [];
            
            if (products.length === 0) {
              return { message: `No products found for search "${search}".` };
            }
            
            return {
              products: products.map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.netPrice,
                discount: p.discountPercent,
                link: `/product/${p.slug || p.id}`
              }))
            };
          } catch (error: any) {
            console.error('Tool execution error:', error);
            return { success: false, error: error.message };
          }
        }
      }),
      getOrderDetails: tool({
        description: 'Fetch the details and status of an order using its Order ID. Use this when the user wants to check their order status or return an order.',
        inputSchema: z.object({
          orderId: z.string().describe('The exact Order ID provided by the customer'),
        }),
        execute: async ({ orderId }) => {
          try {
            const trpcUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc';
            const response = await fetch(`${trpcUrl}/order.getOrderDetails?input=${encodeURIComponent(JSON.stringify({ orderId }))}`);
            
            if (!response.ok) {
              return { success: false, error: 'Order not found or API error. Make sure the Order ID is correct.' };
            }
            
            const data = await response.json();
            return { success: true, order: data.result?.data || data };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        }
      })
    },
  });
  return result.toUIMessageStreamResponse();
}
