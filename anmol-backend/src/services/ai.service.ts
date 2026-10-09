import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateProductDetails(imageUrl: string, categoryName: string = '') {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      
      const imagePart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType,
        },
      };
      
      const prompt = `
        You are an expert e-commerce copywriter for an Indian clothing store named "Anmol Vastralay".
        Analyze the attached image of a clothing item (likely a saree, kurti, suit, or lehenga)${categoryName ? ` in the category "${categoryName}"` : ''}.
        
        Generate the following details based on the visual features of the item. Return ONLY a valid JSON object with the exact keys below:
        
        {
          "name": "A catchy, SEO-friendly name for the product (max 60 chars)",
          "shortDescription": "A 1-2 sentence catchy short description (max 150 chars)",
          "description": "A detailed, engaging product description including material feel, occasion, and style recommendations (2-3 paragraphs, formatted with basic HTML like <p> and <ul>)",
          "metaTitle": "SEO title for the page (max 60 chars)",
          "metaDescription": "SEO meta description (max 160 chars)"
        }
      `;

      const result = await this.model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error generating product details:', error);
      throw new Error('Failed to generate product details with AI');
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
      
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleanedText);
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
}
