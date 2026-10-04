import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3010),
  geminiApiKey: required('GEMINI_API_KEY'),
  backendApiUrl: (process.env.BACKEND_API_URL || 'http://localhost:3001').replace(
    /\/$/,
    '',
  ),
  internalToken: process.env.AI_SERVICE_INTERNAL_TOKEN?.trim() || '',
  knowledgeBasePath: process.env.KNOWLEDGE_BASE_PATH || './knowledgeBase.json',
};
