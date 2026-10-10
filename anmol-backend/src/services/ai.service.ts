import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private groq: Groq;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }

  async generateProductDetails(
    inputOrImageUrl:
      | string
      | {
          imageUrl?: string;
          categoryName?: string;
          name?: string;
          brand?: string;
          description?: string;
        },
    legacyCategoryName: string = '',
  ) {
    const input =
      typeof inputOrImageUrl === 'string'
        ? { imageUrl: inputOrImageUrl, categoryName: legacyCategoryName }
        : inputOrImageUrl;

    const {
      imageUrl,
      categoryName = '',
      name = '',
      brand = '',
      description = '',
    } = input;

    try {
      let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;

      if (imageUrl && imageUrl.trim()) {
        try {
          const response = await fetch(imageUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = response.headers.get('content-type') || 'image/jpeg';
            imagePart = {
              inlineData: {
                data: buffer.toString('base64'),
                mimeType,
              },
            };
          }
        } catch (imgErr) {
          console.warn('Failed to fetch image for AI generation, proceeding with text context:', imgErr);
        }
      }

      const prompt = `
        You are an expert e-commerce copywriter, merchandiser, and SEO specialist for an Indian clothing and ethnic wear store named "Anmol Vastralay".
        Your task is to generate complete, high-converting, professional, and SEO-optimized product details.

        Available inputs and context:
        ${categoryName ? `- Category: "${categoryName}"` : '- Category: Indian Apparel / Ethnic Wear'}
        ${name ? `- User-provided Title/Name: "${name}"` : '- No title provided yet.'}
        ${brand ? `- User-provided Brand: "${brand}"` : '- No brand provided.'}
        ${description ? `- User-provided Description/Notes: "${description}"` : '- No initial description provided.'}
        ${imagePart ? '- Product Image: Attached visual media' : '- Product Image: None provided'}

        Requirements:
        1. "name":
           - If the user provided a title, elevate and refine it into a catchy, premium, SEO-friendly e-commerce product title (max 70 chars). Keep the user's intended style/color/fabric.
           - If no title was provided, generate an attractive and specific product title based on the image visual features and category.
        2. "brand":
           - If the user specified a brand, keep and return that exact brand.
           - If no brand was specified, suggest a fitting brand name or return an empty string.
        3. "description":
           - Generate a detailed, rich, engaging product description (2-3 paragraphs) structured with basic HTML tags (<p>, <ul>, <li>, <strong>).
           - Synthesize both the visual features of the item (colors, fabric look, embroidery, border, work) AND the user's initial description/notes (if any).
           - Clearly highlight fabric feel, craft/work details, occasions (e.g. festive, wedding, party, everyday luxury), and styling/care suggestions.
        4. "shortDescription":
           - A 1-2 sentence catchy short description (max 150 chars).
        5. "metaTitle":
           - Highly optimized SEO title for Google Search (max 60 chars), incorporating product name, brand (if available), and store/category keyword.
        6. "metaDescription":
           - Highly optimized SEO meta description (max 160 chars) highlighting fabric, style, and reasons to buy.

        Return ONLY a valid JSON object with the exact keys: "name", "brand", "shortDescription", "description", "metaTitle", "metaDescription".
        Do NOT wrap in markdown code blocks or backticks. Return raw JSON only.
      `;

      const contentPayload = imagePart ? [prompt, imagePart] : [prompt];
      const result = await this.model.generateContent(contentPayload);
      const text = result.response.text() || '{}';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to find JSON in AI response:', text);
        throw new Error('AI did not return valid JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || name || '',
        brand: parsed.brand || brand || '',
        shortDescription: parsed.shortDescription || '',
        description: parsed.description || description || '',
        metaTitle: parsed.metaTitle || '',
        metaDescription: parsed.metaDescription || '',
      };
    } catch (error: any) {
      console.error('Error generating product details:', error);
      throw new Error(error.message || 'Failed to generate product details with AI');
    }
  }

  async generateCategoryDetails(input: { name: string; description: string }) {
    const { name, description } = input;
    try {
      const prompt = `
        You are an expert e-commerce copywriter and SEO specialist for an Indian clothing and ethnic wear store named "Anmol Vastralay".
        Your task is to generate complete, high-converting, professional, and SEO-optimized category details.

        Available inputs:
        - Category Name: "${name}"
        - Brief Description/Notes: "${description}"

        Requirements:
        1. "description":
           - Generate a rich, engaging category description (1-2 paragraphs).
           - Expand on the brief description provided, highlighting the types of products (like sarees, lehengas, suits, etc.) customers can expect in this category.
           - Emphasize quality, occasions (festive, wedding, daily wear), and the cultural richness of Anmol Vastralay.
        2. "metaTitle":
           - Highly optimized SEO title for Google Search (max 60 chars), incorporating the category name and store keyword (e.g. "Buy [Category] Online | Anmol Vastralay").
        3. "metaDescription":
           - Highly optimized SEO meta description (max 160 chars) highlighting the best features of this category and reasons to shop.

        Return ONLY a valid JSON object with the exact keys: "description", "metaTitle", "metaDescription".
        Do NOT wrap in markdown code blocks or backticks. Return raw JSON only.
      `;

      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
      });

      const text = response.choices[0]?.message?.content || '{}';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI did not return valid JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        description: parsed.description || description || '',
        metaTitle: parsed.metaTitle || '',
        metaDescription: parsed.metaDescription || '',
      };
    } catch (error: any) {
      console.error('Error generating category details:', error);
      throw new Error(error.message || 'Failed to generate category details with AI');
    }
  }

  async generateDemandForecast(salesData: string) {
    try {
      const prompt = `
        You are an expert AI Inventory & Supply Chain Manager for an Indian clothing store named "Anmol Vastralay".
        Analyze the following historical sales data (aggregated by category) to forecast demand.
        
        Historical Data:
        ${salesData}
        
        Based on this data, provide demand forecasting insights for each category. 
        Take into account that clothing stores have seasonal trends (e.g. festivals, weddings).
        
        Return ONLY a valid JSON array of objects with the exact keys below:
        [
          {
            "categoryName": "Name of the category",
            "trend": "UP" or "DOWN" or "STABLE",
            "demandLevel": "HIGH" or "MEDIUM" or "LOW",
            "recommendation": "Short, actionable advice (e.g., 'Restock immediately', 'Hold inventory', 'Run a sale')",
            "reasoning": "1-2 sentences explaining why you made this prediction based on the data provided"
          }
        ]
      `;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('Failed to find JSON array in AI response:', text);
        throw new Error('AI did not return valid JSON');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating demand forecast:', error);
      throw new Error('Failed to generate demand forecast with AI');
    }
  }

  async generateChatbotReply(userMessage: string) {
    try {
      const prompt = `
        You are a helpful, polite, and professional customer support AI for an Indian clothing store named "Anmol Vastralay".
        Your goal is to assist customers with queries about order tracking, return policies, product availability, and general store information.
        
        Store Information:
        - Store Name: Anmol Vastralay
        - Products: Sarees, Kurtis, Suits, Lehengas, and Menswear.
        - Return Policy: 7 days return policy for unused items with original tags.
        - Shipping: Free shipping on orders over ₹1000. Delivery usually takes 3-5 business days.
        - Support Hours: 24/7 via this WhatsApp bot. Human agents are available 10 AM to 7 PM.
        
        Customer Message: "${userMessage}"
        
        Provide a concise, friendly, and helpful response. Keep it short (under 3-4 sentences) unless a detailed explanation is needed. Do not use Markdown, just plain text as it will be sent via WhatsApp.
      `;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      return text.trim();
    } catch (error) {
      console.error('Error generating chatbot reply:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact our human support during business hours.";
    }
  }

  async generateRetargetingMessage(prompt: string) {
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      return text.trim();
    } catch (error) {
      console.error('Error generating retargeting message:', error);
      return "Hi there! We miss you at Anmol Vastralay. Use code COMEBACK15 for 15% off your next purchase! 🛍️";
    }
  }

  async polishCampaignMessage(draftMessage: string) {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert copywriter for an Indian ethnic fashion store. Your job is to polish, improve, and add excitement (using emojis) to WhatsApp broadcast messages sent to customers. Keep the response concise, engaging, and directly ready to be sent (no quotes or extra text). Retain the original intent but make it sound professional and catchy.'
          },
          {
            role: 'user',
            content: `Please polish this WhatsApp broadcast message:\n\n${draftMessage}`
          }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content?.trim() || draftMessage;
    } catch (error) {
      console.error('Error polishing campaign message with Groq:', error);
      return draftMessage; // fallback to original if API fails
    }
  }
}
