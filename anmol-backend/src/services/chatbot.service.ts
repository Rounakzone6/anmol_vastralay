import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  Part,
  SchemaType,
  GenerativeModel,
} from '@google/generative-ai';

interface LocalFunctionCall {
  name: string;
  args: Record<string, unknown>;
}
import { PrismaService } from '@backend/services/prisma.service';
import { ProductService } from '@backend/services/product.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `You are a helpful and polite WhatsApp assistant for 'Anmol Vastralay', a clothing store.
You MUST ALWAYS reply in Hinglish (a mix of Hindi and English written in English script).
Example: "Haanji, aapka order process ho gaya hai."
You can help users with order tracking, store location, policies, and checking new products.
Keep your answers concise and friendly, suitable for WhatsApp. Do not use markdown formatting like bolding or italics excessively.`,
        tools: [
          {
            functionDeclarations: [
              {
                name: 'checkOrderStatus',
                description:
                  'Get the status and details of an order using order ID. Ask the user for order ID if not provided.',
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    orderId: {
                      type: SchemaType.STRING,
                      description: 'The unique order ID',
                    },
                  },
                  required: ['orderId'],
                },
              },
              {
                name: 'getLatestCollection',
                description: 'Get the latest products available in the store.',
                parameters: { type: SchemaType.OBJECT, properties: {} },
              },
              {
                name: 'getStoreInfo',
                description:
                  'Get information about the store location, return policy, and delivery policy.',
                parameters: { type: SchemaType.OBJECT, properties: {} },
              },
            ],
          },
        ],
      });
    }
  }

  async processMessage(
    phone: string,
    text: string,
    mediaUrl?: string,
    mimeType?: string,
  ): Promise<string> {
    if (!this.model) {
      this.logger.error('Gemini model is not configured.');
      return 'Sorry, the AI assistant is not configured right now.';
    }

    try {
      const parts: Part[] = [];

      if (text) {
        parts.push({ text });
      }

      if (mediaUrl && mimeType) {
        this.logger.log(`Fetching media from: ${mediaUrl}`);
        const response = await fetch(mediaUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        parts.push({
          inlineData: {
            data: base64,
            mimeType: mimeType,
          },
        });
      }

      const chat = this.model.startChat();
      let result = await chat.sendMessage(parts);
      let response = result.response;

      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0] as unknown as LocalFunctionCall;
        let functionResponse: Record<string, unknown> = {};
        this.logger.log(`AI called function: ${call.name}`);

        if (call.name === 'checkOrderStatus') {
          const args = call.args;
          try {
            const order = await this.prisma.order.findUnique({
              where: { id: String(args.orderId) },
              include: { items: { include: { product: true } } },
            });
            if (order) {
              functionResponse = {
                status: order.status,
                totalAmount: order.totalAmount,
                items: order.items
                  .map((i) => String(i.product.name))
                  .join(', '),
              };
            } else {
              functionResponse = { error: 'Order not found' };
            }
          } catch (e: unknown) {
            this.logger.debug(e);
            functionResponse = { error: 'Invalid order ID format' };
          }
        } else if (call.name === 'getLatestCollection') {
          try {
            const products = await this.productService.list({
              page: 1,
              pageSize: 3,
            });
            functionResponse = {
              products: products.items.map((p) => ({
                name: p.name,
                price: p.netPrice,
              })),
            };
          } catch (e: unknown) {
            this.logger.debug(e);
            functionResponse = { error: 'Could not fetch products' };
          }
        } else if (call.name === 'getStoreInfo') {
          functionResponse = {
            location: 'Anmol Vastralay, Main Market, City Center',
            returnPolicy:
              'We offer a 7-day hassle-free return policy for unused items.',
            delivery: 'Standard delivery takes 3-5 business days.',
          };
        }

        result = await chat.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: functionResponse,
            },
          },
        ]);
        response = result.response;
      }

      return response.text();
    } catch (error) {
      this.logger.error('Error in chatbot service processing:', error);
      return 'Maaf karna, abhi main kuch samajh nahi paa raha hoon. Kripya thodi der baad try karein.';
    }
  }
}
