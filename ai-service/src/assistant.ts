import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool, type ModelMessage } from 'ai';
import { z } from 'zod';
import { config } from './config.js';
import {
  createCodOrder,
  getCheckoutData,
  getOrderDetails,
  searchProducts,
} from './backend-api.js';
import fs from 'node:fs/promises';

const SYSTEM_PROMPT = `
You are the official Customer Care AI Agent for Anmol Vastralay, a premium clothing store in Gopalganj, Bihar.
Reply in clear English or Hinglish, matching the user's language. Be polite, concise, and accurate.
Use the supplied knowledge base for store policies. Never invent product availability, prices, order status, or policies.

You can:
- Answer store, shipping, returns, and contact questions from the knowledge base.
- Search live products using searchProducts whenever the user asks what is available.
- Get a user's order details only when an order ID is provided and the request is authenticated.
- For order placement, first show the cart, total, and default saved address using getCheckoutSummary.
- Place a COD order only after the authenticated user explicitly confirms the complete summary.
- Never call placeCodOrder without an explicit confirmation in the current conversation.

You must not cancel, refund, or modify an order in this service. Razorpay payments must be completed through the website.
`;

const google = createGoogleGenerativeAI({ apiKey: config.geminiApiKey });

async function loadKnowledgeBase(): Promise<string> {
  try {
    return await fs.readFile(config.knowledgeBasePath, 'utf8');
  } catch (error) {
    console.error('Unable to load knowledge base:', error);
    return '';
  }
}

function toModelMessages(messages: unknown): ModelMessage[] {
  if (!Array.isArray(messages)) {
    throw new Error('messages must be an array');
  }

  return messages.map((message) => {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message');
    }
    const value = message as { role?: unknown; content?: unknown; parts?: unknown };
    if (value.role !== 'user' && value.role !== 'assistant' && value.role !== 'system') {
      throw new Error('Invalid message role');
    }
    if (typeof value.content === 'string') {
      return { role: value.role, content: value.content };
    }
    if (Array.isArray(value.parts)) {
      const text = value.parts
        .filter(
          (part): part is { type: 'text'; text: string } =>
            Boolean(part) &&
            typeof part === 'object' &&
            (part as { type?: unknown }).type === 'text' &&
            typeof (part as { text?: unknown }).text === 'string',
        )
        .map((part) => part.text)
        .join('\n');
      return { role: value.role, content: text };
    }
    throw new Error('Message content is required');
  });
}

export async function createChatResponse(
  messages: unknown,
  token?: string,
): Promise<Response> {
  const knowledgeBase = await loadKnowledgeBase();
  const result = streamText({
    model: google('gemini-3.8-flash'),
    system: `${SYSTEM_PROMPT}\n\nKnowledge base:\n${knowledgeBase}`,
    messages: toModelMessages(messages),
    tools: {
      searchProducts: tool({
        description: 'Search live store products by name, color, material, or category.',
        inputSchema: z.object({
          search: z.string().min(1),
          categorySlug: z.string().optional(),
        }),
        execute: async ({ search, categorySlug }) => {
          try {
            const result = await searchProducts(
              { search, categorySlug, pageSize: 5 },
              token,
            );
            return result.products.length
              ? result
              : { message: `No products found for "${search}".` };
          } catch (error) {
            console.error('searchProducts failed:', error);
            return { error: 'Product search is temporarily unavailable.' };
          }
        },
      }),
      getOrderDetails: tool({
        description: 'Get an authenticated user order by its exact order ID.',
        inputSchema: z.object({ orderId: z.string().min(1) }),
        execute: async ({ orderId }) => {
          if (!token) {
            return { error: 'Please sign in before checking order details.' };
          }
          try {
            return await getOrderDetails(orderId, token);
          } catch (error) {
            console.error('getOrderDetails failed:', error);
            return { error: 'Order details are unavailable or the order was not found.' };
          }
        },
      }),
      getCheckoutSummary: tool({
        description:
          'Show the authenticated user their current cart, total, and saved default shipping address before a COD order. Do not place an order.',
        inputSchema: z.object({}),
        execute: async () => {
          if (!token) {
            return { error: 'Please sign in before placing an order.' };
          }
          try {
            return await getCheckoutData(token);
          } catch (error) {
            console.error('getCheckoutSummary failed:', error);
            return { error: 'Checkout details are temporarily unavailable.' };
          }
        },
      }),
      placeCodOrder: tool({
        description:
          'Create a cash-on-delivery order from the authenticated user current cart and default saved address. Call only after the user explicitly confirms the cart, total, address, and COD method.',
        inputSchema: z.object({
          confirmed: z.literal(true),
        }),
        execute: async ({ confirmed }) => {
          if (!token) {
            return { error: 'Please sign in before placing an order.' };
          }
          if (!confirmed) {
            return { error: 'Explicit confirmation is required.' };
          }
          try {
            return await createCodOrder(token);
          } catch (error) {
            console.error('placeCodOrder failed:', error);
            return {
              error:
                'Order could not be placed. Please check that your cart and default address are ready.',
            };
          }
        },
      }),
    },
  });
  return result.toUIMessageStreamResponse();
}
